import { createClient } from '@/lib/supabase/server';
import CajaClient from './CajaClient';

export default async function CajaPage() {
  const supabase = createClient();

  const [{ data: productos }, { data: mesas }] = await Promise.all([
    supabase.from('productos').select('id,nombre,precio,categoria').eq('disponible', true).order('nombre'),
    supabase.from('mesas').select('id,numero_mesa').neq('estado', 'inactiva').order('numero_mesa'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Caja</h1>
        <p className="mt-1 text-sm text-tinta/60">Cargá el pedido de una mesa o para llevar. Al registrarlo, aparece en Cocina.</p>
      </div>
      <CajaClient productos={productos ?? []} mesas={mesas ?? []} />
    </div>
  );
}