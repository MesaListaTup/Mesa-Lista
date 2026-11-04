-- =====================================================================
-- MESA LISTA · V4 · Histórico, cancelaciones y datos de demostración
-- Ejecutar UNA VEZ en Supabase > SQL Editor > New query > Run.
-- No borra datos reales. Los registros generados quedan marcados es_demo=true.
-- Para quitar SOLO la demo: ejecutar el bloque de limpieza al final.
-- =====================================================================

-- 1) Permitir cancelar pedidos y distinguir datos de demostración.
alter table public.pedidos drop constraint if exists pedidos_estado_check;
alter table public.pedidos
  add constraint pedidos_estado_check
  check (estado in ('pendiente', 'preparando', 'entregado', 'cancelado'));

alter table public.pedidos
  add column if not exists es_demo boolean not null default false;

alter table public.reservas
  add column if not exists es_demo boolean not null default false;

alter table public.mensajes_contacto
  add column if not exists es_demo boolean not null default false;

-- 2) Bitácora: conserva cada alta, cambio de estado y cancelación.
create table if not exists public.historial_movimientos (
  id bigserial primary key,
  tabla text not null,
  registro_id uuid not null,
  accion text not null,
  estado_anterior text,
  estado_nuevo text,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists historial_movimientos_created_idx
  on public.historial_movimientos (created_at desc);
create index if not exists historial_movimientos_registro_idx
  on public.historial_movimientos (tabla, registro_id);

alter table public.historial_movimientos enable row level security;
drop policy if exists "historial_staff_select" on public.historial_movimientos;
create policy "historial_staff_select" on public.historial_movimientos
  for select to authenticated using ((select public.es_staff()));
grant select on public.historial_movimientos to authenticated;
grant all on public.historial_movimientos to service_role;

create or replace function public.registrar_movimiento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_accion text;
  v_anterior text;
  v_nuevo text;
  v_detalle jsonb;
begin
  if TG_OP = 'DELETE' then
    v_id := (to_jsonb(OLD)->>'id')::uuid;
    v_accion := 'eliminado';
    v_anterior := to_jsonb(OLD)->>'estado';
    v_nuevo := null;
    v_detalle := to_jsonb(OLD);
  elsif TG_OP = 'INSERT' then
    v_id := (to_jsonb(NEW)->>'id')::uuid;
    v_accion := 'creado';
    v_anterior := null;
    v_nuevo := to_jsonb(NEW)->>'estado';
    v_detalle := to_jsonb(NEW);
  else
    v_id := (to_jsonb(NEW)->>'id')::uuid;
    v_anterior := to_jsonb(OLD)->>'estado';
    v_nuevo := to_jsonb(NEW)->>'estado';
    v_accion := case
      when v_anterior is distinct from v_nuevo then 'cambio_estado'
      else 'actualizado'
    end;
    v_detalle := jsonb_build_object('antes', to_jsonb(OLD), 'despues', to_jsonb(NEW));
  end if;

  insert into public.historial_movimientos
    (tabla, registro_id, accion, estado_anterior, estado_nuevo, detalle)
  values
    (TG_TABLE_NAME, v_id, v_accion, v_anterior, v_nuevo, v_detalle);

  if TG_OP = 'DELETE' then return OLD; else return NEW; end if;
end;
$$;

drop trigger if exists historial_reservas on public.reservas;
create trigger historial_reservas
  after insert or update or delete on public.reservas
  for each row execute function public.registrar_movimiento();

drop trigger if exists historial_pedidos on public.pedidos;
create trigger historial_pedidos
  after insert or update or delete on public.pedidos
  for each row execute function public.registrar_movimiento();

drop trigger if exists historial_mensajes on public.mensajes_contacto;
create trigger historial_mensajes
  after insert or update or delete on public.mensajes_contacto
  for each row execute function public.registrar_movimiento();

-- 3) Datos de demostración: 90 días hacia atrás y 30 días hacia adelante.
-- Re-ejecutable: limpia únicamente filas marcadas como demo.
-- Evita conservar eventos huérfanos de las demos que se regeneran.
delete from public.historial_movimientos h
where (h.tabla = 'mensajes_contacto' and h.registro_id in (select id from public.mensajes_contacto where es_demo = true))
   or (h.tabla = 'pedidos' and h.registro_id in (select id from public.pedidos where es_demo = true))
   or (h.tabla = 'reservas' and h.registro_id in (select id from public.reservas where es_demo = true));
delete from public.mensajes_contacto where es_demo = true;
delete from public.pedidos where es_demo = true;
delete from public.reservas where es_demo = true;

do $$
declare
  v_i integer;
  v_fecha date;
  v_hora time;
  v_estado text;
  v_tipo text;
  v_mesa uuid;
  v_pedido uuid;
  v_producto record;
  v_cantidad integer;
  v_total numeric(10,2);
  v_nombre text;
  v_nombres text[] := array[
    'Lucía Fernández','Mateo González','Sofía Rodríguez','Benjamín López',
    'Valentina Martínez','Joaquín Pérez','Camila Sánchez','Tomás Romero',
    'Martina Díaz','Felipe Torres','Emma Álvarez','Santiago Ruiz',
    'Catalina Acosta','Lautaro Medina','Mía Herrera','Franco Castro',
    'Julieta Silva','Thiago Núñez','Olivia Rojas','Bautista Vega'
  ];
  v_horas time[] := array[
    time '12:00', time '12:30', time '13:00', time '13:30',
    time '14:00', time '20:00', time '20:30', time '21:00',
    time '21:30', time '22:00'
  ];
begin
  -- Reservas históricas y futuras. Las futuras quedan pendientes/confirmadas.
  for v_i in 1..150 loop
    if v_i <= 115 then
      v_fecha := current_date - (1 + floor(random() * 90))::integer;
      v_estado := (array['completada','completada','completada','cancelada'])[1 + floor(random()*4)::integer];
    else
      v_fecha := current_date + (1 + floor(random() * 30))::integer;
      v_estado := (array['pendiente','confirmada','confirmada'])[1 + floor(random()*3)::integer];
    end if;

    v_hora := v_horas[1 + floor(random() * array_length(v_horas,1))::integer];
    v_nombre := v_nombres[1 + floor(random() * array_length(v_nombres,1))::integer];

    insert into public.reservas
      (nombre_cliente, telefono_cliente, fecha_reserva, hora_reserva,
       cantidad_personas, estado, es_demo)
    values
      (v_nombre,
       '+54 11 4' || lpad((floor(random()*10000000))::text, 7, '0'),
       v_fecha, v_hora, 1 + floor(random()*6)::integer,
       v_estado, true);
  end loop;

  -- Pedidos de los últimos 90 días. No se inventan productos: se usan los de la carta.
  for v_i in 1..180 loop
    v_fecha := current_date - (floor(random() * 90))::integer;
    v_tipo := case when random() < 0.72 then 'local' else 'para_llevar' end;
    v_estado := (array['entregado','entregado','entregado','entregado','cancelado','pendiente','preparando'])[1 + floor(random()*7)::integer];
    v_total := 0;

    select id into v_mesa from public.mesas
      where estado <> 'inactiva' order by random() limit 1;

    insert into public.pedidos
      (mesa_id, tipo, estado, total, created_at, es_demo)
    values
      (case when v_tipo = 'local' then v_mesa else null end,
       v_tipo, v_estado, 0,
       (v_fecha + time '12:00' + random() * interval '10 hours') at time zone 'America/Argentina/Buenos_Aires',
       true)
    returning id into v_pedido;

    for v_producto in
      select id, precio from public.productos
      where disponible = true order by random() limit (1 + floor(random()*3)::integer)
    loop
      v_cantidad := 1 + floor(random()*3)::integer;
      insert into public.detalle_pedidos
        (pedido_id, producto_id, cantidad, precio_unitario)
      values (v_pedido, v_producto.id, v_cantidad, v_producto.precio);
      v_total := v_total + v_cantidad * v_producto.precio;
    end loop;

    if v_total = 0 then
      update public.pedidos set total = 0 where id = v_pedido;
    else
      update public.pedidos set total = v_total where id = v_pedido;
    end if;
  end loop;

  -- Mensajes de ejemplo con leídos y no leídos.
  for v_i in 1..24 loop
    v_nombre := v_nombres[1 + floor(random() * array_length(v_nombres,1))::integer];
    insert into public.mensajes_contacto
      (nombre, email, mensaje, leido, created_at, es_demo)
    values
      (v_nombre,
       'demo' || v_i || '@ejemplo.com',
       (array[
         'Hola, quería consultar si tienen disponibilidad para una cena este fin de semana.',
         '¿Me podrían pasar información sobre el menú y las opciones vegetarianas?',
         'Quisiera organizar un cumpleaños para un grupo de 8 personas.',
         'Muchas gracias por la atención. ¿Se puede modificar una reserva?',
         '¿Tienen promociones para grupos o eventos especiales?'
       ])[1 + floor(random()*5)::integer],
       random() > 0.35,
       now() - (floor(random()*60)::integer * interval '1 day'),
       true);
  end loop;
end $$;

-- 4) Vista útil para reportar ventas: solo pedidos entregados (no cancelados).
create or replace view public.resumen_ventas_diarias as
select
  (created_at at time zone 'America/Argentina/Buenos_Aires')::date as fecha,
  count(*) as pedidos_completados,
  coalesce(sum(total), 0)::numeric(12,2) as ventas
from public.pedidos
where estado = 'entregado'
group by 1
order by 1 desc;

-- ---------------------------------------------------------------------
-- LIMPIEZA OPCIONAL DE DEMO (ejecutar solo si querés retirar la demo):
-- delete from public.mensajes_contacto where es_demo = true;
-- delete from public.pedidos where es_demo = true; -- elimina detalles por ON DELETE CASCADE
-- delete from public.reservas where es_demo = true;
-- ---------------------------------------------------------------------
