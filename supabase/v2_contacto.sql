-- =====================================================================
--  MESA LISTA · Migración V2 · Mensajes de contacto
--  Ejecutar en Supabase > SQL Editor (después de mesa_lista.sql). Se puede re-ejecutar.
-- =====================================================================

create table if not exists public.mensajes_contacto (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  email      text not null,
  mensaje    text not null,
  leido      boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mensajes_contacto enable row level security;

-- Solo el staff lee y gestiona; el visitante solo puede enviar vía la función
drop policy if exists "mensajes_staff_all" on public.mensajes_contacto;
create policy "mensajes_staff_all" on public.mensajes_contacto
  for all to authenticated
  using ((select public.es_staff()))
  with check ((select public.es_staff()));

grant select, update, delete on public.mensajes_contacto to authenticated;
grant all on public.mensajes_contacto to service_role;

create or replace function public.crear_mensaje_contacto(p_nombre text, p_email text, p_mensaje text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if length(trim(coalesce(p_nombre, ''))) < 2 then
    raise exception 'Ingresá un nombre válido';
  end if;
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Ingresá un e-mail válido';
  end if;
  if length(trim(coalesce(p_mensaje, ''))) < 5 or length(p_mensaje) > 2000 then
    raise exception 'El mensaje debe tener entre 5 y 2000 caracteres';
  end if;

  insert into public.mensajes_contacto (nombre, email, mensaje)
  values (trim(p_nombre), trim(p_email), trim(p_mensaje))
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.crear_mensaje_contacto(text, text, text) from public, anon, authenticated;
grant execute on function public.crear_mensaje_contacto(text, text, text) to anon, authenticated;
