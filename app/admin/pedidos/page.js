import { createClient } from '@/lib/supabase/server';
import { inicioDiaAR } from '@/lib/utils';
import PedidosClient from './PedidosClient';

export default async function PedidosPage() {
  const supabase = createClient();

  const consulta = (campos) =>
    supabase
      .from('pedidos')
      .select(campos)
      .gte('created_at', inicioDiaAR())
      .order('created_at', { ascending: false });

  const [{ data: productos }, { data: mesas }, conPago] = await Promise.all([
    supabase.from('productos').select('id,nombre,precio,categoria').eq('disponible', true).order('nombre'),
    supabase.from('mesas').select('id,numero_mesa').neq('estado', 'inactiva').order('numero_mesa'),
    consulta('id,estado,tipo,total,created_at,pago_estado,mesas(numero_mesa),detalle_pedidos(cantidad,productos(nombre))'),
  ]);

  // Si todavía no se corrió v4_pagos_mercadopago.sql, se carga sin los datos de pago
  let pedidos = conPago.data;
  const pagosHabilitados = !conPago.error;
  if (conPago.error) {
    pedidos = (await consulta('id,estado,tipo,total,created_at,mesas(numero_mesa),detalle_pedidos(cantidad,productos(nombre))')).data;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Pedidos</h1>
      <PedidosClient productos={productos ?? []} mesas={mesas ?? []} pedidos={pedidos ?? []} pagosHabilitados={pagosHabilitados} />
    </div>
  );
}
