# Prompt para completar el informe de tareas por versiones

Copiá este prompt en una conversación nueva con Claude, adjuntá el repo (zip) y el archivo `Informe de avance.docx`.

---

Actuá como líder técnico y redactor de documentación de un proyecto académico.

**Contexto del proyecto**
- Nombre: Mesa Lista. Sistema de reservas y pedidos para un restaurante (proyecto final de la Tecnicatura Universitaria en Programación, UTN). Profesora: Lic. Leila Coronel.
- Stack: Next.js 14 (App Router), React, TailwindCSS, Supabase (PostgreSQL + Auth + RLS), deploy en Vercel.
- Roles: cliente, staff y admin. El visitante anónimo solo ve el menú y reserva con `crear_reserva`.
- Equipo: [nombres y roles de cada integrante].
- Repo: https://github.com/MesaListaTup/Mesa-Lista

**Etapas del proyecto (cada una es una versión del informe)**
1. Diagrama de base de datos y wireframes.
2. Creación de la base de datos.
3. Desarrollo del backend (funciones SQL, RLS, políticas).
4. Desarrollo del login.
5. Desarrollo de la landing page.
6. Desarrollo de la página de administración.

**Pendientes y mejoras identificadas (V2)**
Formulario de contacto, «Dónde encontrarnos» con mapa de Google, «Nuestra historia», landing y panel responsive con menú hamburguesa, que el cliente elija la mesa, mostrar en cocina el menú que carga el admin, suscripción al plan VIP (extra), «Mis reservas», realtime, delivery y pagos.

**Qué tenés que hacer**
1. Leé el código del repo y el documento adjunto. No inventes funcionalidades: basate solo en lo que existe en el código o en lo que te informo.
2. Por cada versión (1° a 6°) completá el informe respetando exactamente la estructura de la plantilla: tabla **Tareas** (Entregado / En esta entrega / En Proceso / Pendiente), tabla **Problemas Presentados** (Problema / Detalles) y tabla **Integrantes** (Rol / Nombre / E-Mail).
3. En «Entregado» listá lo de versiones anteriores, en «En esta entrega» lo terminado en esa versión, en «En Proceso» lo iniciado y en «Pendiente» lo que sigue.
4. En «Problemas Presentados» incluí problemas reales (técnicos o de organización) con su solución o estado. Si no tenés evidencia de un problema, marcalo como «[a confirmar por el equipo]».
5. Dejá entre corchetes cualquier dato que no conozcas (nombres, mails, fechas).
6. Entregá un .docx por versión (Informe_de_avance_V1.docx, V2, …) y un resumen de una línea por versión.

**Formato**: español rioplatense neutro, frases cortas, tono profesional.
