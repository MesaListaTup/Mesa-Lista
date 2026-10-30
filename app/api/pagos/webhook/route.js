import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mpFetch, estadoDePago, transicionValida, firmaValida } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

// Mercado Pago avisa acá cada vez que cambia un pago. Se configura con notification_url al crear el cobro.
export async function POST(request) {
  const url = new URL(request.url);
  const cuerpo = await request.json().catch(() => ({}));

  const tipo = cuerpo.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const paymentId = cuerpo?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id');

  // Solo nos interesan los pagos; el resto de las notificaciones se confirman sin hacer nada
  if (tipo !== 'payment' || !paymentId) return NextResponse.json({ ok: true });

  if (!firmaValida(request, url.searchParams.get('data.id') ?? String(paymentId))) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  try {
    // No se confía en lo que llega en el aviso: se consulta el pago directamente a Mercado Pago
    const pago = await mpFetch(`/v1/payments/${paymentId}`);
    const pedidoId = pago.external_reference;
    if (!pedidoId) return NextResponse.json({ ok: true });

    const nuevo = estadoDePago(pago.status);
    const db = createAdminClient();

    const { data: pedido } = await db.from('pedidos').select('id,pago_estado').eq('id', pedidoId).maybeSingle();
    if (!pedido) return NextResponse.json({ ok: true });

    // Historial (una fila por cambio de estado de cada pago)
    const { data: yaRegistrado } = await db
      .from('pagos')
      .select('id')
      .eq('mp_payment_id', String(paymentId))
      .eq('mp_status', pago.status)
      .maybeSingle();
    if (!yaRegistrado) {
      await db.from('pagos').insert({
        pedido_id: pedido.id,
        mp_payment_id: String(paymentId),
        mp_status: pago.status,
        estado: nuevo,
        monto: pago.transaction_amount,
        detalle: { status_detail: pago.status_detail, payment_method: pago.payment_method_id, payment_type: pago.payment_type_id },
      });
    }

    if (transicionValida(pedido.pago_estado, nuevo)) {
      await db
        .from('pedidos')
        .update({
          pago_estado: nuevo,
          mp_payment_id: String(paymentId),
          pagado_at: nuevo === 'aprobado' ? new Date().toISOString() : null,
        })
        .eq('id', pedido.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Con 500 Mercado Pago reintenta la notificación más tarde
    console.error('Webhook Mercado Pago:', e.message);
    return NextResponse.json({ error: 'Error procesando el pago' }, { status: 500 });
  }
}

// Mercado Pago a veces verifica la URL con GET
export async function GET() {
  return NextResponse.json({ ok: true });
}
