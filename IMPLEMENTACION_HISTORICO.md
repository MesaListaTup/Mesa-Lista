# Mesa Lista · actualización de histórico y datos demo

## Qué incluye
- `supabase/v4_historico_demo.sql`: migración para permitir pedidos cancelados, marcar datos demo, registrar movimientos de reservas/pedidos/mensajes y generar datos de prueba.
- `app/admin/pedidos/page.js`: carga los últimos 100 pedidos en lugar de mostrar solo los del día.
- `app/admin/pedidos/PedidosClient.jsx`: permite cancelar pedidos sin borrarlos.

## Cómo implementarlo
1. Hacé una copia de seguridad del proyecto y de Supabase antes de ejecutar cambios.
2. En Supabase → SQL Editor, ejecutá primero `supabase/v2_contacto.sql` si todavía no existe `mensajes_contacto`.
3. Ejecutá `supabase/v4_historico_demo.sql`.
4. Reemplazá en tu proyecto los dos archivos de `app/admin/pedidos/` por los de esta entrega.
5. Ejecutá `npm install` si corresponde y luego `npm run dev`; probá en `/admin/pedidos`, `/admin/reservas` y `/admin/mensajes`.
6. Publicá los cambios en tu flujo habitual de GitHub/Vercel.

## Qué datos genera
- 115 reservas históricas y 35 reservas futuras distribuidas en los próximos 30 días.
- 180 pedidos de los últimos 90 días, con detalle de productos existentes en la carta.
- 24 mensajes de contacto de ejemplo.
- Los registros de prueba tienen `es_demo = true`. Los reales quedan en `false`.
- Las ventas se calculan como suma de pedidos `entregado`; los cancelados no cuentan como venta.

## Importante
- Los datos demo son ficticios y sirven para probar el panel. No representan ventas reales.
- Si no hay productos cargados y disponibles, los pedidos demo quedarán sin detalle y con total cero; cargá primero productos en el panel.
- El histórico de movimientos registra altas, modificaciones, cambios de estado y eliminaciones de reservas, pedidos y mensajes.
- La migración asume que ya ejecutaste `mesa_lista.sql` y `v2_contacto.sql`.
- El script se puede volver a ejecutar: vuelve a generar las filas demo, sin borrar registros reales.
- Para retirar datos demo, al final de la migración hay tres sentencias `DELETE` comentadas. Descomentá y ejecutá esas sentencias cuando quieras eliminar la demo.
