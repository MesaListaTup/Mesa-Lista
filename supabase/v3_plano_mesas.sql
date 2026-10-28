-- =====================================================================
--  MESA LISTA · Migración V3 · Elegir mesa en el plano
--  Ejecutar en Supabase > SQL Editor (después de mesa_lista.sql). Se puede re-ejecutar.
--
--  1) mesas_disponibilidad(): le dice a la landing qué mesas están libres
--     para un día y hora, sin exponer la tabla reservas al público.
--  2) crear_reserva(): ahora acepta una mesa elegida (opcional). Si no se
--     elige ninguna, sigue asignando la mesa libre más ajustada.
-- =====================================================================

-- 1) Disponibilidad por mesa (una reserva ocupa la mesa 2 horas, igual que mesa_libre)
create or replace function public.mesas_disponibilidad(p_fecha date, p_hora time, p_personas integer)
returns table (id uuid, numero_mesa integer, capacidad integer, libre boolean)
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
    ) as libre
  from public.mesas m
  where m.estado <> 'inactiva'
  order by m.numero_mesa;
$$;

revoke execute on function public.mesas_disponibilidad(date, time, integer) from public, anon, authenticated;
grant  execute on function public.mesas_disponibilidad(date, time, integer) to anon, authenticated;


-- 2) crear_reserva con mesa opcional.
--    Se borra la versión de 5 parámetros para que no quede una sobrecarga ambigua.
drop function if exists public.crear_reserva(text, text, date, time, integer);

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

  -- Evita que dos personas tomen la misma mesa al mismo tiempo
  perform pg_advisory_xact_lock(hashtext('mesa_lista_reservas'));

  if p_mesa_id is null then
    -- Sin preferencia: la mesa libre más ajustada al grupo
    v_mesa := public.mesa_libre(p_fecha, p_hora, p_personas);
    if v_mesa is null then
      raise exception 'No hay mesas disponibles para ese horario';
    end if;
  else
    -- Mesa elegida en el plano: se valida en el servidor, no se confía en el navegador
    select m.id into v_mesa
    from public.mesas m
    where m.id = p_mesa_id
      and m.estado <> 'inactiva'
      and m.capacidad >= p_personas;

    if v_mesa is null then
      raise exception 'La mesa elegida no está disponible para esa cantidad de personas';
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

revoke execute on function public.crear_reserva(text, text, date, time, integer, uuid) from public, anon, authenticated;
grant  execute on function public.crear_reserva(text, text, date, time, integer, uuid) to anon, authenticated;
