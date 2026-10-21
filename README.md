# Mesa Lista · V1

Sistema de reservas y pedidos para un restaurante. Proyecto final.

**Stack:** Next.js 14 (App Router) · React · TailwindCSS · Supabase (Postgres + Auth + RLS) · Vercel

## 1. Puesta en marcha

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** pegá y ejecutá todo el archivo `supabase/mesa_lista.sql` (tablas, RLS, grants, funciones y datos de ejemplo).
3. Copiá `.env.example` a `.env.local` y completá la URL y la key (Project Settings > API).
4. Instalá y corré:
   ```bash
   npm install
   npm run dev
   ```
5. Abrí http://localhost:3000, andá a **Ingresar > Registrate**, y después en el SQL Editor convertite en admin:
   ```sql
   update public.users set rol = 'admin' where email = 'tu-email@ejemplo.com';
   ```
   Al volver a ingresar vas a entrar directo a `/admin`.

> Tip para desarrollo: en Supabase > Authentication > Providers > Email podés desactivar "Confirm email" para no depender del mail al registrarse.

## 2. Deploy en Vercel

1. Subí el repo a GitHub e importalo en Vercel.
2. Cargá las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. En Supabase > Authentication > URL Configuration agregá la URL de Vercel como *Site URL*.

## 3. Estructura

```
app/
  page.js                 Landing pública (hero + reserva, menú, footer)
  login/page.js           Login y registro
  auth/signout/route.js   Cerrar sesión
  admin/
    layout.js             Protege el panel: solo roles admin y staff
    page.js               Resumen del día (métricas + gráfico)
    reservas/             Confirmar, cancelar, completar, asignar mesa
    mesas/                Grilla de mesas (libre / reservada / ocupada / inactiva)
    pedidos/              Alta de pedidos (local o para llevar) y seguimiento
    productos/            ABM del menú
components/               landing/ y admin/
lib/supabase/             Clientes de Supabase (browser, server, middleware)
lib/config.js             Datos del restaurante (dirección, horarios, etc.)
supabase/mesa_lista.sql   Esquema completo
middleware.js             Refresca la sesión y redirige si no hay login en /admin
```

## 4. Cómo funciona la seguridad

- **RLS activo en todas las tablas.** Los `GRANT` dan acceso a la tabla y las `policies` filtran las filas.
- El visitante anónimo **solo puede leer el menú** y ejecutar dos funciones: `horarios_disponibles` y `crear_reserva`. No puede leer la tabla `reservas`, así no se expone información de otros clientes.
- `crear_reserva` asigna automáticamente la mesa libre más ajustada (cada reserva ocupa 2 h) y bloquea con un lock para evitar doble reserva simultánea.
- `crear_pedido` toma los precios de la base de datos (no del navegador) y guarda el precio unitario en `detalle_pedidos`.
- El rol **no se puede editar desde la app**: solo desde el SQL Editor (o `service_role`).

## 5. Reglas de negocio configurables (en el SQL)

- Turnos: almuerzo 12:00 a 14:30 y cena 20:00 a 22:30, cada 30 min (función `horarios_disponibles`).
- Duración de una reserva: 2 horas (`7200` segundos en `mesa_libre`).
- Se puede reservar con al menos 1 hora de anticipación.
- Zona horaria: `America/Argentina/Buenos_Aires`.

## 6. Ideas para dividir el trabajo en el equipo

| Área | Archivos |
|---|---|
| Landing y diseño | `components/landing/*`, `app/globals.css`, `tailwind.config.js` |
| Reservas (cliente) | `components/landing/ReservaForm.jsx`, funciones SQL de reservas |
| Panel de reservas y mesas | `app/admin/reservas`, `app/admin/mesas` |
| Pedidos y productos | `app/admin/pedidos`, `app/admin/productos` |
| Auth, roles y deploy | `app/login`, `middleware.js`, `lib/supabase/*`, políticas RLS |

## 7. Limitaciones conocidas de la V1 (buen material para V2)

- Si el staff reasigna manualmente una mesa en Reservas, no se valida que se superponga con otra reserva.
- Los clientes logueados no tienen todavía una pantalla "Mis reservas" (la policy de lectura ya está lista).
- Los datos del panel se actualizan al recargar o al operar; no usa Realtime todavía.
- Pendiente de V2/V3: delivery, pantalla de cocina (KDS) y pagos.

## 8. Nota sobre el backend

Esta versión **no necesita un servidor Express aparte**: Next.js se comunica directo con Supabase mediante su SDK, y la lógica sensible vive en funciones SQL protegidas por RLS. Si más adelante necesitan un backend propio, pueden agregarlo con Route Handlers (`app/api/...`).
