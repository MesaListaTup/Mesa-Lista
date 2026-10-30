-- =====================================================================
--  MESA LISTA · Migración V4 · Imágenes del menú
--  Ejecutar en Supabase > SQL Editor. Se puede re-ejecutar.
--  Cada producto puede tener una foto (URL). Si no tiene, la landing muestra
--  una ilustración de su categoría.
-- =====================================================================
alter table public.productos add column if not exists imagen_url text;
alter table public.productos add column if not exists tipo_plato text;  -- pasta, parrilla, pizza, ensalada, postre...
