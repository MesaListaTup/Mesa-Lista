import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/landing/Navbar';
import FondoFijo from '@/components/landing/FondoFijo';
import Footer from '@/components/landing/Footer';
import ReservaModal from '@/components/landing/ReservaModal';
import BotonReservas from '@/components/landing/BotonReservas';
import Reveal from '@/components/landing/Reveal';
import AvatarUploader from '@/components/perfil/AvatarUploader';
import { PUNTOS_POR_RESERVA } from '@/lib/puntos';
import { puedeVerPanel } from '@/lib/roles';
import { formatCodigo, fechaHoraAR } from '@/lib/cupones';
import { IconLogout } from '@tabler/icons-react';

export const metadata = { title: 'Mi perfil · Mesa Lista' };
export const dynamic = 'force-dynamic';

const etiqueta = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';
const tarjeta = 'rounded-2xl border border-white/10 bg-white/5 p-7 md:p-9';

const fechaLarga = (iso) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const fechaCorta = (ts) =>
  new Date(ts).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'short', year: 'numeric' });

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('users')
    .select('nombre, apellido, email, dni, fecha_nacimiento, foto_url, puntos, rol')
    .eq('id', user.id)
    .single();

  const { data: movimientos } = await supabase
    .from('puntos_movimientos')
    .select('id, puntos, detalle, created_at')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: cupones } = await supabase
    .from('cupones')
    .select('id, nombre, descuento, codigo, estado, canjeado_at, usado_at')
    .eq('usuario_id', user.id)
    .order('canjeado_at', { ascending: false });

  const nombre = perfil?.nombre || user.email?.split('@')[0] || 'Hola';
  const nombreCompleto = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || nombre;
  const iniciales = (perfil?.nombre?.[0] ?? nombre[0] ?? '?').toUpperCase() + (perfil?.apellido?.[0] ?? '').toUpperCase();
  const puntos = perfil?.puntos ?? 0;
  const esAdmin = puedeVerPanel(perfil?.rol);

  const datos = [
    ['Email', perfil?.email ?? user.email],
    perfil?.dni && ['DNI', Number(perfil.dni).toLocaleString('es-AR')],
    perfil?.fecha_nacimiento && ['Fecha de nacimiento', fechaLarga(perfil.fecha_nacimiento)],
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      <div className="relative isolate">
        <FondoFijo />
        <main className="min-h-screen bg-black/60 pb-24 pt-28 text-white md:pt-36">
          <div className="mx-auto max-w-[1600px] px-6 md:px-14">
            <Reveal>
              <p className={etiqueta}>Mi perfil</p>
              <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">Hola, {nombre}</h1>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
              {/* Foto y datos personales */}
              <Reveal className={tarjeta}>
                <AvatarUploader userId={user.id} fotoUrl={perfil?.foto_url ?? null} iniciales={iniciales} />

                <div className="mt-8 text-center">
                  <p className="font-display text-2xl">{nombreCompleto}</p>
                </div>

                <dl className="mt-6 space-y-5">
                  {datos.map(([titulo, valor]) => (
                    <div key={titulo}>
                      <dt className={etiqueta}>{titulo}</dt>
                      <dd className="mt-2 break-all text-lg text-white/90">{valor}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  {esAdmin && (
                    <Link href="/admin" className="border-b border-white/60 pb-0.5 hover:border-white">Ir al panel</Link>
                  )}
                  <form action="/auth/signout" method="post">
                    <button className="inline-flex items-center gap-2 text-white/60 hover:text-white">
                      <IconLogout className="size-4" stroke={1.75} aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              </Reveal>

              {/* Puntos */}
              <Reveal className={tarjeta} delay={150}>
                <p className={etiqueta}>Puntos acumulados</p>
                <p className="mt-4 font-display text-7xl leading-none sm:text-8xl">{puntos.toLocaleString('es-AR')}</p>
                <p className="mt-5 max-w-md text-lg text-white/75">
                  Sumás {PUNTOS_POR_RESERVA} puntos por cada reserva que hacés con tu cuenta.
                </p>

                <div className="mt-8">
                  <BotonReservas className="border border-white/70 px-8 py-3 text-[12px] font-medium uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:bg-white hover:text-black">
                    Reservar una mesa
                  </BotonReservas>
                </div>

                <h2 className={`${etiqueta} mt-12`}>Historial</h2>
                {movimientos?.length ? (
                  <ul className="mt-4 space-y-3">
                    {movimientos.map((m) => (
                      <li key={m.id} className="flex items-baseline justify-between gap-4 rounded-xl bg-white/5 px-5 py-4">
                        <div className="min-w-0">
                          <p className="text-white/90">{m.detalle ?? 'Puntos'}</p>
                          <p className="mt-0.5 text-sm text-white/55">{fechaCorta(m.created_at)}</p>
                        </div>
                        <p className="shrink-0 font-display text-2xl">{m.puntos > 0 ? `+${m.puntos}` : m.puntos}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-white/65">
                    Todavía no sumaste puntos. Hacé tu primera reserva y te llevás {PUNTOS_POR_RESERVA}.
                  </p>
                )}
              </Reveal>
            </div>

            {/* Cupones canjeados: el código se lo muestra al mesero en el local */}
            <Reveal className={`${tarjeta} mt-6`}>
              <h2 className={etiqueta}>Cupones canjeados</h2>
              {cupones?.length ? (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {cupones.map((c) => {
                    const usado = c.estado === 'usado';
                    return (
                      <li key={c.id} className={`rounded-xl bg-white/5 p-5 ${usado ? 'opacity-60' : ''}`}>
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-display text-4xl leading-none">{c.descuento}%</p>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">
                            {usado ? 'Usado' : 'Disponible'}
                          </span>
                        </div>
                        <p className="mt-2 text-white/80">{c.nombre}</p>
                        <p className={`mt-4 font-mono text-2xl tracking-[0.2em] ${usado ? 'line-through' : ''}`}>{formatCodigo(c.codigo)}</p>
                        <p className="mt-3 text-sm text-white/55">
                          {usado ? `Usado el ${fechaHoraAR(c.usado_at)}.` : `Canjeado el ${fechaHoraAR(c.canjeado_at)}. Mostrale este código al mesero.`}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-white/65">
                  Todavía no canjeaste cupones. Mirá los{' '}
                  <Link href="/beneficios" className="underline underline-offset-4 hover:text-white">beneficios</Link> disponibles.
                </p>
              )}
            </Reveal>
          </div>
        </main>
        <Footer />
      </div>
      {/* Lo abre el botón "Reservar una mesa" y la opción "Reservas" del menú */}
      <ReservaModal />
    </>
  );
}