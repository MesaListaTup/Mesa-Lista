# Cobros con Mercado Pago

## Flujo de estados

```
Pedido (cocina):   pendiente ──► preparando ──► entregado

Pago (Mercado Pago):
  sin_pagar ──► pendiente ──► aprobado ──► reembolsado
                    │
                    ├──► rechazado
                    └──► cancelado
```

1. El personal toca **Cobrar con Mercado Pago** en un pedido. La app (servidor) lee el pedido de la base, crea la preferencia de pago y devuelve el link. El pedido pasa a `pendiente`.
2. El cliente paga en la página de Mercado Pago.
3. Mercado Pago avisa a `POST /api/pagos/webhook`. La app **consulta el pago directamente a Mercado Pago** (no confía en el aviso), guarda el historial en `pagos` y actualiza `pedidos.pago_estado`.
4. Un pago `aprobado` no se pisa por un aviso atrasado de `pendiente` o `rechazado`; solo puede pasar a `reembolsado`.

El estado de la cocina y el del pago son independientes: un pedido puede estar entregado y sin cobrar, o cobrado y todavía en preparación.

## Puesta en marcha

1. Ejecutar `supabase/v4_pagos_mercadopago.sql` en el SQL Editor.
2. Crear una aplicación en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers) y copiar el **Access Token de prueba** (`TEST-...`).
3. Cargar en Vercel (Settings > Environment Variables) y en `.env.local`:
   - `MP_ACCESS_TOKEN`
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API). **Es secreta: solo servidor.**
   - `NEXT_PUBLIC_APP_URL` (la URL https de Vercel)
   - `MP_WEBHOOK_SECRET` (opcional pero recomendado)
4. En Mercado Pago > Webhooks, configurar la URL `https://TU-APP.vercel.app/api/pagos/webhook` con el evento **Pagos**.
5. Hacer una compra de prueba con un usuario comprador de prueba y tarjetas de prueba de Mercado Pago.
6. Para cobrar de verdad, reemplazar el token por el de producción.

## Notas
- En `localhost` el cobro se crea igual, pero Mercado Pago no puede avisar al webhook (necesita https público). Para probar el aviso en local se puede usar un túnel (ngrok, Cloudflare Tunnel).
- Los montos siempre salen de la base de datos, nunca del navegador.
- La ruta `/api/pagos/crear` solo acepta personal con sesión iniciada.
- Esto es una base para el proyecto: antes de cobrar en producción hay que probar el flujo completo con cuentas de prueba.
