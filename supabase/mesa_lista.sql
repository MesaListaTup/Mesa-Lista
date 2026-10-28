-- =====================================================================
--  MESA LISTA · Esquema V1 para Supabase (PostgreSQL)
--  Incluye: tablas, funciones, triggers, RLS, policies, GRANTs y datos semilla.
--
--  Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--  Es seguro volver a ejecutarlo (usa IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABLAS
-- ---------------------------------------------------------------------

-- Perfiles públicos (1 a 1 con auth.users). El rol se asigna a mano o desde el panel de Supabase.
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  nombre     text,
  rol        text not null default 'cliente' check (rol in ('admin', 'staff', 'cliente')),
  created_at timestamptz not null default now()
);

create table if not exists public.mesas (
  id          uuid primary key default gen_random_uuid(),
  numero_mesa integer not null unique,
  capacidad   integer not null check (capacidad > 0),
  estado      text not null default 'disponible' check (estado in ('disponible', 'ocupada', 'inactiva'))
);

-- mesa_id es opcional: la reserva puede quedar sin mesa hasta que el staff la asigne.
create table if not exists public.reservas (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid references public.users (id) on delete set null,
  nombre_cliente    text not null,
  telefono_cliente  text not null,
  mesa_id           uuid references public.mesas (id) on delete set null,
  fecha_reserva     date not null,
  hora_reserva      time not null,
  cantidad_personas integer not null check (cantidad_personas > 0),
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente', 'confirmada', 'completada', 'cancelada')),
  created_at        timestamptz not null default now()
);
create index if not exists reservas_fecha_hora_idx on public.reservas (fecha_reserva, hora_reserva);
create index if not exists reservas_mesa_idx on public.reservas (mesa_id);
create index if not exists reservas_cliente_idx on public.reservas (cliente_id);

create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  precio      numeric(10, 2) not null check (precio >= 0),
  categoria   text not null check (categoria in ('cafeteria', 'comida', 'bebida')),
  disponible  boolean not null default true
);

create table if not exists public.pedidos (
  id         uuid primary key default gen_random_uuid(),
  mesa_id    uuid references public.mesas (id) on delete set null,   -- null si es para llevar
  usuario_id uuid references public.users (id) on delete set null,   -- quién tomó el pedido
  estado     text not null default 'pendiente' check (estado in ('pendiente', 'preparando', 'entregado')),
  tipo       text not null default 'local' check (tipo in ('local', 'para_llevar')),
  total      numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists pedidos_created_idx on public.pedidos (created_at);

create table if not exists public.detalle_pedidos (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references public.pedidos (id) on delete cascade,
  producto_id     uuid references public.productos (id) on delete set null,
  cantidad        integer not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null    -- se guarda al momento del pedido
);
create index if not exists detalle_pedido_idx on public.detalle_pedidos (pedido_id);


-- ---------------------------------------------------------------------
-- 2. FUNCIONES AUXILIARES DE ROL (SECURITY DEFINER para evitar recursión en RLS)
-- ---------------------------------------------------------------------

create or replace function public.es_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select u.rol in ('admin', 'staff') from public.users u where u.id = auth.uid()),
    false
  );
$$;

create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select u.rol = 'admin' from public.users u where u.id = auth.uid()),
    false
  );
$$;


-- ---------------------------------------------------------------------
-- 3. TRIGGER: crear perfil automáticamente cuando alguien se registra
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    'cliente'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles para usuarios que ya existían antes de correr este script
insert into public.users (id, email, nombre, rol)
select u.id, u.email, split_part(u.email, '@', 1), 'cliente'
from auth.users u
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 4. LÓGICA DE RESERVAS (disponibilidad + creación atómica)
--    Cada reserva ocupa una mesa durante 2 horas. El cliente NO lee la tabla
--    reservas: solo usa estas funciones, así no se expone información de otros.
-- ---------------------------------------------------------------------

-- Devuelve la mesa libre más ajustada a la cantidad de personas (o null)
create or replace function public.mesa_libre(p_fecha date, p_hora time, p_personas integer)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select m.id
  from public.mesas m
  where m.estado <> 'inactiva'
    and m.capacidad >= p_personas
    and not exists (
      select 1
      from public.reservas r
      where r.mesa_id = m.id
        and r.estado in ('pendiente', 'confirmada')
        and abs(extract(epoch from ((r.fecha_reserva + r.hora_reserva) - (p_fecha + p_hora)))) < 7200
    )
  order by m.capacidad asc, m.numero_mesa asc
  limit 1;
$$;

-- Turnos del restaurante: almuerzo 12:00–14:30 y cena 20:00–22:30 (cada 30 min)
create or replace function public.horarios_disponibles(p_fecha date, p_personas integer)
returns table (hora time, disponible boolean)
language sql stable security definer set search_path = ''
as $$
  select
    s.slot as hora,
    (
      public.mesa_libre(p_fecha, s.slot, p_personas) is not null
      and (p_fecha + s.slot) > ((now() at time zone 'America/Argentina/Buenos_Aires') + interval '1 hour')
    ) as disponible
  from (
    select g::time as slot
    from generate_series(timestamp '2000-01-01 12:00', timestamp '2000-01-01 14:30', interval '30 minutes') g
    union all
    select g::time
    from generate_series(timestamp '2000-01-01 20:00', timestamp '2000-01-01 22:30', interval '30 minutes') g
  ) s
  order by s.slot;
$$;

-- Crea la reserva (estado 'pendiente') asignando automáticamente una mesa libre
create or replace function public.crear_reserva(
  p_nombre text,
  p_telefono text,
  p_fecha date,
  p_hora time,
  p_personas integer
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

  v_mesa := public.mesa_libre(p_fecha, p_hora, p_personas);
  if v_mesa is null then
    raise exception 'No hay mesas disponibles para ese horario';
  end if;

  insert into public.reservas
    (cliente_id, nombre_cliente, telefono_cliente, mesa_id, fecha_reserva, hora_reserva, cantidad_personas, estado)
  values
    (auth.uid(), trim(p_nombre), trim(p_telefono), v_mesa, p_fecha, p_hora, p_personas, 'pendiente')
  returning id into v_id;

  return v_id;
end;
$$;


-- ---------------------------------------------------------------------
-- 5. LÓGICA DE PEDIDOS (atómica; el precio sale de la base, no del navegador)
--    p_items = [{"producto_id": "uuid", "cantidad": 2}, ...]
-- ---------------------------------------------------------------------

create or replace function public.crear_pedido(p_mesa_id uuid, p_tipo text, p_items jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id    uuid;
  v_total numeric(10, 2);
begin
  if not public.es_staff() then
    raise exception 'No autorizado';
  end if;
  if p_tipo not in ('local', 'para_llevar') then
    raise exception 'Tipo de pedido inválido';
  end if;
  if p_tipo = 'local' and p_mesa_id is null then
    raise exception 'Seleccioná una mesa para el pedido';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío';
  end if;

  insert into public.pedidos (mesa_id, usuario_id, tipo, estado, total)
  values (case when p_tipo = 'local' then p_mesa_id else null end, auth.uid(), p_tipo, 'pendiente', 0)
  returning id into v_id;

  insert into public.detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario)
  select v_id, p.id, (i ->> 'cantidad')::integer, p.precio
  from jsonb_array_elements(p_items) i
  join public.productos p on p.id = (i ->> 'producto_id')::uuid
  where p.disponible and (i ->> 'cantidad')::integer > 0;

  select coalesce(sum(d.cantidad * d.precio_unitario), 0)
  into v_total
  from public.detalle_pedidos d
  where d.pedido_id = v_id;

  if v_total = 0 then
    raise exception 'El pedido no tiene productos válidos';
  end if;

  update public.pedidos set total = v_total where id = v_id;
  return v_id;
end;
$$;


-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.users           enable row level security;
alter table public.mesas           enable row level security;
alter table public.reservas        enable row level security;
alter table public.productos       enable row level security;
alter table public.pedidos         enable row level security;
alter table public.detalle_pedidos enable row level security;

-- users: cada persona ve su perfil; el staff ve todos. Solo se puede editar el propio nombre.
drop policy if exists "users_select" on public.users;
create policy "users_select" on public.users
  for select to authenticated
  using (id = (select auth.uid()) or (select public.es_staff()));

drop policy if exists "users_update_propio" on public.users;
create policy "users_update_propio" on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- mesas: solo staff (el público consulta disponibilidad con horarios_disponibles())
drop policy if exists "mesas_staff_all" on public.mesas;
create policy "mesas_staff_all" on public.mesas
  for all to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

-- reservas: staff todo; el cliente logueado ve sus propias reservas.
-- Las altas de clientes pasan por crear_reserva() (no hay INSERT directo para anon).
drop policy if exists "reservas_staff_all" on public.reservas;
create policy "reservas_staff_all" on public.reservas
  for all to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

drop policy if exists "reservas_cliente_select" on public.reservas;
create policy "reservas_cliente_select" on public.reservas
  for select to authenticated
  using (cliente_id = (select auth.uid()));

-- productos: el menú disponible es público; el staff gestiona todo
drop policy if exists "productos_publico_select" on public.productos;
create policy "productos_publico_select" on public.productos
  for select to anon
  using (disponible = true);

drop policy if exists "productos_auth_select" on public.productos;
create policy "productos_auth_select" on public.productos
  for select to authenticated
  using (disponible = true or (select public.es_staff()));

drop policy if exists "productos_staff_insert" on public.productos;
create policy "productos_staff_insert" on public.productos
  for insert to authenticated
  with check ((select public.es_staff()));

drop policy if exists "productos_staff_update" on public.productos;
create policy "productos_staff_update" on public.productos
  for update to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

drop policy if exists "productos_staff_delete" on public.productos;
create policy "productos_staff_delete" on public.productos
  for delete to authenticated
  using ((select public.es_staff()));

-- pedidos y detalle: solo staff
drop policy if exists "pedidos_staff_all" on public.pedidos;
create policy "pedidos_staff_all" on public.pedidos
  for all to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

drop policy if exists "detalle_staff_all" on public.detalle_pedidos;
create policy "detalle_staff_all" on public.detalle_pedidos
  for all to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));


-- ---------------------------------------------------------------------
-- 7. GRANTS (necesarios porque RLS está activo y la Data API exige permisos explícitos)
--    Los GRANT dan acceso a la tabla; las POLICIES de arriba filtran qué filas.
-- ---------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

-- anon (visitante sin sesión): solo puede leer el menú
grant select on public.productos to anon;

-- authenticated (clientes y staff; las policies deciden qué ve cada uno)
grant select on public.users to authenticated;
grant update (nombre) on public.users to authenticated;   -- el rol NO se puede editar desde la app
grant select, insert, update, delete on public.mesas           to authenticated;
grant select, insert, update, delete on public.reservas        to authenticated;
grant select, insert, update, delete on public.productos       to authenticated;
grant select, insert, update, delete on public.pedidos         to authenticated;
grant select, insert, update, delete on public.detalle_pedidos to authenticated;

-- service_role (solo backend / dashboard, bypassea RLS)
grant all on all tables    in schema public to service_role;
grant all on all functions in schema public to service_role;

-- Funciones: quitar el acceso por defecto y dar solo lo necesario
revoke execute on function public.es_staff()                                          from public, anon, authenticated;
revoke execute on function public.es_admin()                                          from public, anon, authenticated;
revoke execute on function public.handle_new_user()                                   from public, anon, authenticated;
revoke execute on function public.mesa_libre(date, time, integer)                     from public, anon, authenticated;
revoke execute on function public.horarios_disponibles(date, integer)                 from public, anon, authenticated;
revoke execute on function public.crear_reserva(text, text, date, time, integer)      from public, anon, authenticated;
revoke execute on function public.crear_pedido(uuid, text, jsonb)                     from public, anon, authenticated;

grant execute on function public.es_staff()  to authenticated;   -- lo usan las policies
grant execute on function public.es_admin()  to authenticated;
grant execute on function public.horarios_disponibles(date, integer)             to anon, authenticated;
grant execute on function public.crear_reserva(text, text, date, time, integer)  to anon, authenticated;
grant execute on function public.crear_pedido(uuid, text, jsonb)                 to authenticated;


-- ---------------------------------------------------------------------
-- 8. DATOS SEMILLA (mesas y menú de ejemplo)
-- ---------------------------------------------------------------------

insert into public.mesas (numero_mesa, capacidad) values
  (1, 2), (2, 2), (3, 2), (4, 2),
  (5, 4), (6, 4), (7, 4), (8, 4),
  (9, 6), (10, 6),
  (11, 8)
on conflict (numero_mesa) do nothing;

insert into public.productos (nombre, descripcion, precio, categoria)
select * from (values
  ('Milanesa napolitana',  'Con jamón, salsa y mozzarella gratinada. Viene con papas fritas.', 12500, 'comida'),
  ('Ñoquis de papa',       'Caseros, con salsa fileto o crema de cuatro quesos.',               9800, 'comida'),
  ('Bife de chorizo',      '350 g a la parrilla con ensalada mixta.',                          17500, 'comida'),
  ('Ensalada de la casa',  'Rúcula, tomate cherry, parmesano y aceto balsámico.',               7200, 'comida'),
  ('Tarta de verduras',    'Masa casera, zapallitos, cebolla caramelizada y queso.',            8400, 'comida'),
  ('Flan casero',          'Con dulce de leche y crema.',                                       4800, 'comida'),
  ('Café espresso',        'Blend de la casa.',                                                 2200, 'cafeteria'),
  ('Cortado',              'Espresso con un toque de leche.',                                   2500, 'cafeteria'),
  ('Café con leche',       'Con medialunas de manteca (2 unidades).',                           4200, 'cafeteria'),
  ('Limonada con menta',   'Exprimida al momento, con jengibre.',                               3800, 'bebida'),
  ('Agua mineral',         '500 ml, con o sin gas.',                                            2000, 'bebida'),
  ('Vino malbec (copa)',   'Selección de bodega mendocina.',                                    4500, 'bebida')
) as v(nombre, descripcion, precio, categoria)
where not exists (select 1 from public.productos);


-- ---------------------------------------------------------------------
-- 9. DAR ROL DE ADMINISTRADOR (ejecutar DESPUÉS de registrarte en la app)
--    Reemplazá el email por el tuyo y corré solo esta sentencia:
-- ---------------------------------------------------------------------
-- update public.users set rol = 'admin' where email = 'tu-email@ejemplo.com';
--
-- Para dar acceso a un empleado: set rol = 'staff'
