import { createClient } from '@/lib/supabase/server';
import { inicioDiaAR } from '@/lib/utils';
import CocinaClient from './CocinaClient';

export default async function CocinaPage() {
  const supabase = createClient();

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id,estado,tipo,created_at,mesas(numero_mesa),detalle_pedidos(cantidad,productos(nombre))')
    .gte('created_at', inicioDiaAR())
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Cocina</h1>
        <p className="mt-1 text-sm text-tinta/60">Pedidos de hoy cargados desde Caja. Se actualiza solo.</p>
      </div>
      <CocinaClient pedidos={pedidos ?? []} />
    </div>
  );
}
