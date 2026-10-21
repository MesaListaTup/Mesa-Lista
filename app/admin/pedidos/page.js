import { createClient } from '@/lib/supabase/server';
import { inicioDiaAR } from '@/lib/utils';
import PedidosClient from './PedidosClient';

export default async function PedidosPage() {
  const supabase = createClient();

  const [{ data: productos }, { data: mesas }, { data: pedidos }] = await Promise.all([
    supabase.from('productos').select('id,nombre,precio,categoria').eq('disponible', true).order('nombre'),
    supabase.from('mesas').select('id,numero_mesa').neq('estado', 'inactiva').order('numero_mesa'),
    supabase
      .from('pedidos')
      .select('id,estado,tipo,total,created_at,mesas(numero_mesa),detalle_pedidos(cantidad,productos(nombre))')
      .gte('created_at', inicioDiaAR())
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Pedidos</h1>
      <PedidosClient productos={productos ?? []} mesas={mesas ?? []} pedidos={pedidos ?? []} />
    </div>
  );
}
