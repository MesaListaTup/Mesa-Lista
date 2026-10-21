import { createClient } from '@/lib/supabase/server';
import ProductosClient from './ProductosClient';

export default async function ProductosPage() {
  const supabase = createClient();
  const { data: productos } = await supabase
    .from('productos')
    .select('id,nombre,descripcion,precio,categoria,disponible')
    .order('categoria')
    .order('nombre');

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Productos</h1>
      <ProductosClient productos={productos ?? []} />
    </div>
  );
}
