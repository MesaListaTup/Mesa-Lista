import { createClient } from '@/lib/supabase/server';
import ProductosClient from './ProductosClient';

export default async function ProductosPage() {
  const supabase = createClient();
  const consulta = (campos) => supabase.from('productos').select(campos).order('categoria').order('nombre');

  // Con foto y tipo de plato; si todavía no se corrió v4_imagenes_menu.sql, sin esas columnas
  let { data: productos, error } = await consulta('id,nombre,descripcion,precio,categoria,disponible,imagen_url,tipo_plato');
  if (error) ({ data: productos } = await consulta('id,nombre,descripcion,precio,categoria,disponible'));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Productos</h1>
      <ProductosClient productos={productos ?? []} />
    </div>
  );
}
