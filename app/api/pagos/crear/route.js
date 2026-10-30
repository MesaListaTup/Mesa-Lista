import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hayMercadoPago, mpFetch } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

// POST /api/pagos/crear  { pedido_id }
// Crea el cobro en Mercado Pago (Checkout Pro) y devuelve el link de pago.
export async function POST(request) {
  const supabase = createClient();

  // 1) Solo el personal logueado puede generar cobros
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { data: perfil } = await supabase.from('users').select('rol').eq('id', user.id).single();
  if (!['admin', 'staff'].includes(perfil?.rol)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  if (!hayMercadoPago()) {
    return NextResponse.json({ error: 'Mercado Pago no está configurado (falta MP_ACCESS_TOKEN).' }, { status: 503 });
  }

  const { pedido_id } = await request.json().catch(() => ({}));
  if (!pedido_id) return NextResponse.json({ error: 'Falta pedido_id' }, { status: 400 });

  // 2) Los montos salen de la base de datos, nunca del navegador
  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('id,total,pago_estado,detalle_pedidos(cantidad,precio_unitario,productos(nombre))')
    .eq('id', pedido_id)
    .single();
  if (error || !pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
  if (pedido.pago_estado === 'aprobado') return NextResponse.json({ error: 'Este pedido ya está pagado.' }, { status: 409 });
  if (!pedido.detalle_pedidos?.length) return NextResponse.json({ error: 'El pedido no tiene productos.' }, { status: 400 });

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, '');
  const esHttps = base.startsWith('https://'); // Mercado Pago solo avisa y redirige a direcciones https públicas

  const preferencia = {
    items: pedido.detalle_pedidos.map((d) => ({
      title: d.productos?.nombre ?? 'Producto',
      quantity: d.cantidad,
      unit_price: Number(d.precio_unitario),
      currency_id: 'ARS',
    })),
    external_reference: pedido.id,
    statement_descriptor: 'MESA LISTA',
    ...(esHttps && {
      notification_url: `${base}/api/pagos/webhook`,
      back_urls: {
        success: `${base}/admin/pedidos?pago=ok`,
        pending: `${base}/admin/pedidos?pago=pendiente`,
        failure: `${base}/admin/pedidos?pago=error`,
      },
      auto_return: 'approved',
    }),
  };

  try {
    const pref = await mpFetch('/checkout/preferences', { method: 'POST', body: JSON.stringify(preferencia) });
    await supabase.from('pedidos').update({ pago_estado: 'pendiente', mp_preference_id: pref.id }).eq('id', pedido.id);
    const url = process.env.MP_ACCESS_TOKEN.startsWith('TEST-') ? pref.sandbox_init_point ?? pref.init_point : pref.init_point;
    return NextResponse.json({ url, preference_id: pref.id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
