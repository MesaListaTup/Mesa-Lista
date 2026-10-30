-- =====================================================================
--  MESA LISTA · Migración V4 · Reglas de mesas
--  Ejecutar en Supabase > SQL Editor (después de v3_plano_mesas.sql). Se puede re-ejecutar.
--
--  1) Capacidad de cada mesa: acepta grupos de (capacidad - 2) a (capacidad + 2).
--     Para cambiar la tolerancia, editá los dos números de mesa_acepta().
--  2) Una reserva ocupa la mesa 2 horas: no hay "sobremesa". Pasado ese tiempo la mesa
--     se libera sola (cerrar_vencidos()).
--  3) Validación también cuando el staff reasigna la mesa a mano (capacidad y superposición).
--  4) Columna "posicion" que usa el plano del panel (si ya existe, no pasa nada).
-- =====================================================================

alter table public.mesas add column if not exists posicion integer;
alter table public.mesas add column if not exists ocupada_desde timestamptz;

-- 1) Regla de capacidad ------------------------------------------------
create or replace function public.mesa_acepta(p_capacidad integer, p_personas integer)
returns boolean
language sql immutable
as $$
  select p_personas >= greatest(1, p_capacidad - 2)   -- mínimo: capacidad - 2
     and p_personas <= p_capacidad + 2;               -- máximo: capacidad + 2
$$;

-- La mesa libre más ajustada que acepte al grupo (primero las que entran sin sillas extra)
create or replace function public.mesa_libre(p_fecha date, p_hora time, p_personas integer)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select m.id
  from public.mesas m
  where m.estado <> 'inactiva'
    and public.mesa_acepta(m.capacidad, p_personas)
    and not exists (
      select 1
      from public.reservas r
      where r.mesa_id = m.id
        and r.estado in ('pendiente', 'confirmada')
        and abs(extract(epoch from ((r.fecha_reserva + r.hora_reserva) - (p_fecha + p_hora)))) < 7200
    )
  order by (m.capacidad < p_personas) asc, abs(m.capacidad - p_personas) asc, m.numero_mesa asc
  limit 1;
$$;

-- Disponibilidad por mesa: ahora también dice si la mesa acepta al grupo
drop function if exists public.mesas_disponibilidad(date, time, integer);
create or replace function public.mesas_disponibilidad(p_fecha date, p_hora time, p_personas integer)
returns table (id uuid, numero_mesa integer, capacidad integer, libre boolean, acepta boolean)
language sql stable security definer set search_path = ''
as $$
  select
    m.id,
    m.numero_mesa,
    m.capacidad,
    not exists (
      select 1
      from public.reservas r
      where r.mesa_id = m.id
        and r.estado in ('pendiente', 'confirmada')
        and abs(extract(epoch from ((r.fecha_reserva + r.hora_reserva) - (p_fecha + p_hora)))) < 7200
    ) as libre,
    public.mesa_acepta(m.capacidad, p_personas) as acepta
  from public.mesas m
  where m.estado <> 'inactiva'
  order by m.numero_mesa;
$$;

revoke execute on function public.mesas_disponibilidad(date, time, integer) from public, anon, authenticated;
grant  execute on function public.mesas_disponibilidad(date, time, integer) to anon, authenticated;

-- crear_reserva: valida la regla de capacidad en el servidor
create or replace function public.crear_reserva(
  p_nombre text,
  p_telefono text,
  p_fecha date,
  p_hora time,
  p_personas integer,
  p_mesa_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_mesa uuid;
  v_id   uuid;
begin
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Ingresá un nombre válido';
  end if;
  if length(trim(coalesce(p_telefono, ''))) < 6 then
    raise exception 'Ingresá un teléfono válido';
  end if;
  if p_personas is null or p_personas < 1 or p_personas > 12 then
    raise exception 'La cantidad de personas debe estar entre 1 y 12';
  end if;
  if not (p_hora between time '12:00' and time '14:30' or p_hora between time '20:00' and time '22:30') then
    raise exception 'Horario fuera de servicio';
  end if;
  if (p_fecha + p_hora) <= (now() at time zone 'America/Argentina/Buenos_Aires') then
    raise exception 'La fecha y hora deben ser futuras';
  end if;

  perform pg_advisory_xact_lock(hashtext('mesa_lista_reservas'));

  if p_mesa_id is null then
    v_mesa := public.mesa_libre(p_fecha, p_hora, p_personas);
    if v_mesa is null then
      raise exception 'No hay mesas disponibles para ese horario';
    end if;
  else
    select m.id into v_mesa
    from public.mesas m
    where m.id = p_mesa_id
      and m.estado <> 'inactiva'
      and public.mesa_acepta(m.capacidad, p_personas);

    if v_mesa is null then
      raise exception 'Esa mesa no es adecuada para % personas. Elegí otra o dejá que la asignemos.', p_personas;
    end if;

    if exists (
      select 1
      from public.reservas r
      where r.mesa_id = v_mesa
        and r.estado in ('pendiente', 'confirmada')
        and abs(extract(epoch from ((r.fecha_reserva + r.hora_reserva) - (p_fecha + p_hora)))) < 7200
    ) then
      raise exception 'Esa mesa ya fue reservada en ese horario. Elegí otra.';
    end if;
  end if;

  insert into public.reservas
    (cliente_id, nombre_cliente, telefono_cliente, mesa_id, fecha_reserva, hora_reserva, cantidad_personas, estado)
  values
    (auth.uid(), trim(p_nombre), trim(p_telefono), v_mesa, p_fecha, p_hora, p_personas, 'pendiente')
  returning id into v_id;

  return v_id;
end;
$$;

-- 3) Validación cuando el staff cambia la mesa / personas / fecha de una reserva activa
create or replace function public.validar_asignacion_mesa()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.mesa_id is null or new.estado not in ('pendiente', 'confirmada') then
    return new;
  end if;

  if not exists (
    select 1 from public.mesas m
    where m.id = new.mesa_id and public.mesa_acepta(m.capacidad, new.cantidad_personas)
  ) then
    raise exception 'La mesa elegida no es adecuada para % personas (acepta de capacidad-2 a capacidad+2).', new.cantidad_personas;
  end if;

  if exists (
    select 1 from public.reservas r
    where r.mesa_id = new.mesa_id
      and r.id <> new.id
      and r.estado in ('pendiente', 'confirmada')
      and abs(extract(epoch from ((r.fecha_reserva + r.hora_reserva) - (new.fecha_reserva + new.hora_reserva)))) < 7200
  ) then
    raise exception 'Esa mesa ya tiene otra reserva dentro de las 2 horas de ese horario.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_asignacion_mesa on public.reservas;
create trigger trg_validar_asignacion_mesa
  before insert or update of mesa_id, cantidad_personas, fecha_reserva, hora_reserva, estado
  on public.reservas
  for each row execute function public.validar_asignacion_mesa();

-- 2) Sin sobremesa: a las 2 horas se libera la mesa --------------------

-- Guarda desde cuándo está ocupada una mesa
create or replace function public.marcar_ocupada_desde()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.estado <> 'ocupada' then
    new.ocupada_desde := null;
  elsif tg_op = 'INSERT' then
    new.ocupada_desde := now();
  elsif old.estado is distinct from 'ocupada' then
    new.ocupada_desde := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mesas_ocupada_desde on public.mesas;
create trigger trg_mesas_ocupada_desde
  before insert or update of estado on public.mesas
  for each row execute function public.marcar_ocupada_desde();

-- Cierra lo vencido (la llama el panel al cargar; también se puede programar con pg_cron):
--   * mesas ocupadas hace más de 2 horas  -> disponibles
--   * reservas confirmadas cuya hora + 2 h ya pasó -> completadas
--   * reservas pendientes que nadie confirmó y ya pasaron -> canceladas
create or replace function public.cerrar_vencidos()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  ahora_ar timestamp := (now() at time zone 'America/Argentina/Buenos_Aires');
  n_mesas int;
  n_comp  int;
  n_canc  int;
begin
  if not (select public.es_staff()) then
    raise exception 'Solo el personal puede ejecutar esta acción';
  end if;

  update public.mesas
     set estado = 'disponible'
   where estado = 'ocupada'
     and ocupada_desde is not null
     and ocupada_desde < now() - interval '2 hours';
  get diagnostics n_mesas = row_count;

  update public.reservas
     set estado = 'completada'
   where estado = 'confirmada'
     and (fecha_reserva + hora_reserva) + interval '2 hours' < ahora_ar;
  get diagnostics n_comp = row_count;

  update public.reservas
     set estado = 'cancelada'
   where estado = 'pendiente'
     and (fecha_reserva + hora_reserva) + interval '2 hours' < ahora_ar;
  get diagnostics n_canc = row_count;

  return jsonb_build_object('mesas_liberadas', n_mesas, 'reservas_completadas', n_comp, 'reservas_canceladas', n_canc);
end;
$$;

revoke execute on function public.cerrar_vencidos() from public, anon;
grant  execute on function public.cerrar_vencidos() to authenticated;
