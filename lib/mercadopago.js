import crypto from 'node:crypto';

const API = 'https://api.mercadopago.com';

export const hayMercadoPago = () => Boolean(process.env.MP_ACCESS_TOKEN);

export async function mpFetch(ruta, opciones = {}) {
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
    cache: 'no-store',
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.message ?? `Mercado Pago respondió ${r.status}`);
  return datos;
}

// Estado de Mercado Pago -> estado de pago de Mesa Lista
//   sin_pagar -> pendiente -> aprobado | rechazado | cancelado | reembolsado
export function estadoDePago(statusMP) {
  switch (statusMP) {
    case 'approved':
    case 'authorized':
      return 'aprobado';
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return 'pendiente';
    case 'rejected':
      return 'rechazado';
    case 'cancelled':
      return 'cancelado';
    case 'refunded':
    case 'charged_back':
      return 'reembolsado';
    default:
      return 'pendiente';
  }
}

// No se pisa un pago ya aprobado con una notificación atrasada ("pendiente" o "rechazado" que llega tarde)
export function transicionValida(actual, nuevo) {
  if (actual === nuevo) return false;
  if (actual === 'aprobado') return nuevo === 'reembolsado';
  if (actual === 'reembolsado') return false;
  return true;
}

// Valida la firma que Mercado Pago envía en cada notificación (si definiste MP_WEBHOOK_SECRET)
export function firmaValida(request, dataId) {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) return true;
  const firma = request.headers.get('x-signature') ?? '';
  const requestId = request.headers.get('x-request-id') ?? '';
  const partes = Object.fromEntries(firma.split(',').map((p) => p.trim().split('=')));
  if (!partes.ts || !partes.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : String(dataId);
  const manifiesto = `id:${id};request-id:${requestId};ts:${partes.ts};`;
  const esperada = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(partes.v1));
  } catch {
    return false;
  }
}
