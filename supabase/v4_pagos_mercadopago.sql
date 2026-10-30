-- =====================================================================
--  MESA LISTA · Migración V4 · Cobros con Mercado Pago
--  Ejecutar en Supabase > SQL Editor. Se puede re-ejecutar.
--
--  Estado del pedido (cocina):  pendiente -> preparando -> entregado
--  Estado del pago (Mercado Pago): sin_pagar -> pendiente -> aprobado
--                                              \-> rechazado | cancelado | reembolsado
-- =====================================================================

alter table public.pedidos add column if not exists pago_estado text not null default 'sin_pagar';
alter table public.pedidos drop constraint if exists pedidos_pago_estado_check;
alter table public.pedidos add constraint pedidos_pago_estado_check
  check (pago_estado in ('sin_pagar', 'pendiente', 'aprobado', 'rechazado', 'cancelado', 'reembolsado'));
alter table public.pedidos add column if not exists mp_preference_id text;
alter table public.pedidos add column if not exists mp_payment_id text;
alter table public.pedidos add column if not exists pagado_at timestamptz;

-- Historial de notificaciones de Mercado Pago (también evita procesar dos veces lo mismo)
create table if not exists public.pagos (
  id            uuid primary key default gen_random_uuid(),
  pedido_id     uuid references public.pedidos (id) on delete set null,
  mp_payment_id text not null,
  mp_status     text not null,
  estado        text not null,
  monto         numeric(10, 2),
  detalle       jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists pagos_pedido_idx on public.pagos (pedido_id);
create index if not exists pagos_mp_idx on public.pagos (mp_payment_id);

alter table public.pagos enable row level security;

drop policy if exists "pagos_staff_select" on public.pagos;
create policy "pagos_staff_select" on public.pagos
  for select to authenticated
  using ((select public.es_staff()));

grant select on public.pagos to authenticated;
grant all on public.pagos to service_role;
-- (las escrituras las hace el webhook del servidor con la service_role)
