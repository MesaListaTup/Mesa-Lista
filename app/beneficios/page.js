import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/landing/Navbar';
import FondoFijo from '@/components/landing/FondoFijo';
import Footer from '@/components/landing/Footer';
import ReservaModal from '@/components/landing/ReservaModal';
import Reveal from '@/components/landing/Reveal';
import BeneficiosLista from '@/components/beneficios/BeneficiosLista';
import { PUNTOS_POR_RESERVA } from '@/lib/puntos';

export const metadata = {
  title: 'Beneficios · Mesa Lista',
  description: 'Canjeá tus puntos por descuentos en Mesa Lista.',
};
export const dynamic = 'force-dynamic';

const etiqueta = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';

// Misma estructura que /menu: foto fija de fondo, velo oscuro y el contenido por encima.
export default async function BeneficiosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: beneficios }, perfilRes] = await Promise.all([
    supabase.from('beneficios').select('id, nombre, descripcion, descuento, costo_puntos').eq('activo', true).order('orden'),
    user ? supabase.from('users').select('puntos').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ]);
  const puntos = user ? (perfilRes.data?.puntos ?? 0) : null;

  const pasos = [
    ['1', `Reservá y sumá ${PUNTOS_POR_RESERVA} puntos con cada reserva.`],
    ['2', 'Canjeá tus puntos por un cupón de descuento.'],
    ['3', 'Mostrale el código al mesero cuando estés en el local.'],
  ];

  return (
    <>
      <Navbar />
      <div className="relative isolate">
        <FondoFijo />
        <main className="min-h-screen bg-black/60 pb-24 pt-28 text-white md:pt-36">
          <div className="mx-auto max-w-[1600px] px-6 md:px-14">
            <Reveal>
              <p className={etiqueta}>Beneficios</p>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">Canjeá tus puntos</h1>
              <p className="mt-4 max-w-xl text-lg text-white/75">
                Cada reserva que hacés con tu cuenta suma puntos. Cambialos por descuentos para tu próxima visita.
              </p>
            </Reveal>

            {/* Puntos del usuario, o invitación a ingresar */}
            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8" delay={100}>
              {puntos == null ? (
                <>
                  <p className="max-w-xl text-lg text-white/80">Ingresá o creá tu cuenta para sumar puntos y canjearlos por descuentos.</p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <Link href="/login" className="border-b border-white/60 pb-0.5 hover:border-white">Ingresar</Link>
                    <Link href="/login?modo=registro" className="border-b border-white/60 pb-0.5 hover:border-white">Registrarme</Link>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className={etiqueta}>Tus puntos</p>
                    <p className="mt-2 font-display text-5xl leading-none">{puntos.toLocaleString('es-AR')}</p>
                  </div>
                  <Link href="/perfil" className="border-b border-white/60 pb-0.5 text-sm hover:border-white">Ver mi perfil y mis cupones</Link>
                </>
              )}
            </Reveal>

            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {pasos.map(([n, texto], i) => (
                <li key={n}>
                  <Reveal className="flex items-start gap-4" delay={i * 100}>
                    <span className="font-display text-4xl leading-none text-white/40" aria-hidden="true">{n}</span>
                    <p className="text-white/75">{texto}</p>
                  </Reveal>
                </li>
              ))}
            </ol>

            <div className="mt-12">
              <BeneficiosLista beneficios={beneficios ?? []} puntos={puntos} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
      {/* El botón "Reservas" del menú de navegación abre este modal */}
      <ReservaModal />
    </>
  );
}
