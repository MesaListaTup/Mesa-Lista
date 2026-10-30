import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Contacto from '@/components/landing/Contacto';
import Ilustracion from '@/components/ui/Ilustracion';
import { SISTEMA } from '@/lib/config';

export const metadata = {
  title: 'Mesa Lista · Sistema de reservas y pedidos para restaurantes',
  description: 'Reservas online con plano de mesas, panel de gestión, pedidos y cobros con Mercado Pago para restaurantes.',
};

const FUNCIONES = [
  { t: 'Reservas online', d: 'El cliente elige día, personas y horario. Solo ve los turnos con mesa libre, sin llamadas ni esperas.' },
  { t: 'Elegir mesa en el plano', d: 'Plano del salón en pantalla. Cada mesa acepta grupos de hasta 2 personas menos o más que su capacidad.' },
  { t: '2 horas por mesa', d: 'Cada reserva ocupa la mesa 2 horas y después se libera sola: sin sobremesas que desordenen la agenda.' },
  { t: 'Panel de gestión', d: 'Resumen del día con gráficos, reservas con estados claros, mesas en tiempo real y mensajes de clientes.' },
  { t: 'Pedidos y menú', d: 'Pedidos en el local y para llevar, carta con fotos que se actualiza en un click y cierre de cuenta.' },
  { t: 'Cobros con Mercado Pago', d: 'El pedido sigue su flujo de estados y el pago se aprueba automáticamente cuando el cliente paga.' },
];

const PASOS = [
  ['1', 'El cliente reserva', 'Desde la web del restaurante, en menos de un minuto y desde el celular.'],
  ['2', 'El local confirma', 'La reserva llega al panel. Se confirma con un click o se reasigna la mesa.'],
  ['3', 'Se atiende y se cobra', 'Se toma el pedido, se cobra con Mercado Pago y la mesa vuelve a estar libre.'],
];

const PLANES = [
  { n: 'Esencial', d: 'Reservas online y panel de reservas y mesas.', items: ['Landing del restaurante', 'Reservas con plano de mesas', 'Panel de reservas y mesas'] },
  { n: 'Pro', d: 'Todo el salón y la cocina en un solo lugar.', items: ['Todo lo de Esencial', 'Pedidos y carta con fotos', 'Cobros con Mercado Pago'], destacado: true },
  { n: 'VIP', d: 'Para grupos y locales con varios salones.', items: ['Todo lo de Pro', 'Soporte prioritario', 'Personalización de marca'] },
];

export default function Sistema() {
  return (
    <>
      <Navbar variante="sistema" />
      <main>
        <section className="gingham border-b border-tinta/10">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
            <div className="rounded-lg bg-papel p-7 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-tomate">Software para restaurantes</p>
              <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">{SISTEMA.eslogan}.</h1>
              <p className="mt-6 max-w-lg text-lg text-tinta/80">
                {SISTEMA.nombre} es un sistema que cada local usa con su propia marca: reservas online, mesas, pedidos y
                cobros en un mismo panel.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/" className="btn btn-primary">Probar la demo</Link>
                <a href="#contacto" className="btn btn-ghost">Pedir información</a>
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-xl">
              <p className="text-sm font-semibold">¿Qué es la demo?</p>
              <p className="mt-2 text-sm text-tinta/75">
                La página del “Bodegón La Esquina” es solo un ejemplo del sitio que recibe un restaurante. Lo que se
                ofrece es el sistema que hay detrás: la landing, las reservas y el panel.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3" aria-hidden="true">
                {['pasta', 'parrilla', 'postre'].map((t) => (
                  <div key={t} className="rounded-lg bg-sifon/70 p-2"><Ilustracion tipo={t} className="h-auto w-full" /></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="incluye" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-4xl sm:text-5xl">Qué incluye</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCIONES.map((f) => (
              <li key={f.t} className="panel">
                <h3 className="font-display text-xl">{f.t}</h3>
                <p className="mt-2 text-sm text-tinta/75">{f.d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="como" className="border-y border-tinta/10 bg-sifon/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-4xl sm:text-5xl">Cómo funciona</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {PASOS.map(([n, t, d]) => (
                <li key={n} className="rounded-lg bg-white p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tinta font-bold text-white">{n}</span>
                  <h3 className="mt-4 font-display text-xl">{t}</h3>
                  <p className="mt-2 text-sm text-tinta/75">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="planes" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-4xl sm:text-5xl">Planes</h2>
          <p className="mt-3 max-w-xl text-tinta/75">Valores a convenir según el tamaño del local. Escribinos y armamos una propuesta.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANES.map((p) => (
              <div key={p.n} className={`rounded-lg border p-6 ${p.destacado ? 'border-tomate bg-white shadow-lg' : 'border-tinta/10 bg-white'}`}>
                {p.destacado && <p className="mb-2 text-xs font-semibold uppercase text-tomate">El más elegido</p>}
                <h3 className="font-display text-2xl">{p.n}</h3>
                <p className="mt-2 text-sm text-tinta/75">{p.d}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {p.items.map((i) => (<li key={i}>✓ {i}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <Contacto
          titulo="Hablemos de tu restaurante"
          descripcion="Contanos cómo trabaja tu local y te mostramos cómo quedaría con Mesa Lista."
        />
      </main>
      <Footer variante="sistema" />
    </>
  );
}
