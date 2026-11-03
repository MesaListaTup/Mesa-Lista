'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mrs_Saint_Delafield } from 'next/font/google';
import { abrirReserva } from '@/lib/reserva-evento';

const firma = Mrs_Saint_Delafield({ subsets: ['latin'], weight: '400' });

// Los anclas llevan "/" adelante para que también funcionen desde /menu
const LINKS = [
  { href: '/menu', label: 'Menú' },
  { href: '/#visitanos', label: 'Dónde encontrarnos' },
  { href: '/#contacto', label: 'Contacto' },
];

const LINKS_MENU = [{ accion: 'reservar', label: 'Reservas' }, ...LINKS];

export default function NavbarClient({ estado, nombre }) {
  const [abierto, setAbierto] = useState(false);
  const [solida, setSolida] = useState(false);
  const botonRef = useRef(null);
  const cerrarRef = useRef(null);
  const pathname = usePathname();
  const enInicio = pathname === '/';
  const [activa, setActiva] = useState(null); // id de la sección visible (solo en la landing)

  // En la landing es transparente sobre la foto y se oscurece al salir del hero.
  // En el resto de las páginas (ej. /menu) es oscura siempre, porque el contenido pasa por debajo.
  useEffect(() => {
    if (!enInicio) {
      setSolida(true);
      return;
    }
    const alScrollear = () => setSolida(window.scrollY > window.innerHeight - 120);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, [enInicio]);

  // Scroll-spy: en la landing, marca como activa la sección de la barra que está a la vista
  useEffect(() => {
    if (!enInicio) {
      setActiva(null);
      return;
    }
    const ids = LINKS.filter((l) => l.href.startsWith('/#')).map((l) => l.href.slice(2));
    let pendiente = false;

    const calcular = () => {
      pendiente = false;
      const linea = window.innerHeight * 0.4; // la sección activa es la que cruza esta altura de la pantalla
      let actual = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= linea && r.bottom > linea) actual = id;
      }
      // Al llegar al final de la página queda activa la última sección, aunque el footer ocupe la pantalla
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        actual = ids[ids.length - 1];
      }
      setActiva(actual);
    };
    const pedirCalculo = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(calcular);
      }
    };

    calcular();
    window.addEventListener('scroll', pedirCalculo, { passive: true });
    window.addEventListener('resize', pedirCalculo);
    return () => {
      window.removeEventListener('scroll', pedirCalculo);
      window.removeEventListener('resize', pedirCalculo);
    };
  }, [enInicio]);

  // Menú abierto: bloquea el scroll, cierra con Escape y mueve el foco adentro
  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = 'hidden';
    const alTeclear = (e) => e.key === 'Escape' && cerrarConFoco();
    window.addEventListener('keydown', alTeclear);
    cerrarRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  function cerrarConFoco() {
    setAbierto(false);
    botonRef.current?.focus();
  }

  const Logo = ({ className = '' }) => (
    <Link href="/" className={`${firma.className} leading-none text-white ${className}`} aria-label={`${nombre}, inicio`}>
      {nombre}
    </Link>
  );

  return (
    <>
      <header
        className={`hero-fade-in fixed inset-x-0 top-0 z-40 transition-all duration-500 ${solida ? 'border-b border-white/10 bg-black/80 backdrop-blur-md' : 'border-b border-transparent'
          }`}
        style={{ animationDelay: '300ms' }}
      >
        <nav
          aria-label="Principal"
          className={`mx-auto grid max-w-[1600px] grid-cols-2 items-center px-6 transition-all duration-500 md:px-14 lg:grid-cols-[1fr_auto_1fr] ${solida ? 'py-2' : 'py-5 md:py-7'
            }`}
        >
          <Logo className="text-4xl md:text-5xl" />

          <ul className="hidden items-center gap-10 lg:flex">
            {LINKS.map((l) => {
              const esAncla = l.href.startsWith('/#');
              const activo = esAncla ? activa === l.href.slice(2) : pathname === l.href;
              return (
                <li key={l.href}>
                  {/* Línea sutil bajo la palabra: aparece al apoyar el mouse (o enfocar con teclado) y
                      se mantiene mientras estamos dentro de esa sección o página */}
                  <Link
                    href={l.href}
                    aria-current={activo ? (esAncla ? 'location' : 'page') : undefined}
                    className={`relative inline-block pb-1.5 font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:bg-white/80 after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 ${activo ? 'after:scale-x-100' : 'after:scale-x-0'
                      }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            ref={botonRef}
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={abierto}
            aria-controls="menu-principal"
            className="group flex h-11 w-11 flex-col items-end justify-center gap-[7px] justify-self-end"
          >
            <span className="h-[3px] w-8 bg-white transition-all group-hover:w-6" />
            <span className="h-[3px] w-8 bg-white" />
            <span className="h-[3px] w-8 bg-white transition-all group-hover:w-6" />
          </button>
        </nav>
      </header>

      {/* Menú a pantalla completa */}
      <div
        id="menu-principal"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        aria-hidden={!abierto}
        className={`fixed inset-0 z-50 flex flex-col bg-black/95 px-6 py-5 text-white backdrop-blur-md transition-[opacity,visibility] duration-300 md:px-14 md:py-7 ${abierto ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
      >
        <div className="flex items-center justify-between">
          <Logo className="text-4xl md:text-5xl" />
          <button
            ref={cerrarRef}
            type="button"
            onClick={cerrarConFoco}
            aria-label="Cerrar menú"
            className="flex h-11 w-11 items-center justify-center"
          >
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        <nav aria-label="Secciones" className="flex flex-1 flex-col justify-center gap-1 md:items-center">
          {LINKS_MENU.map((l, i) => {
            const clases = `font-display text-4xl transition-all duration-500 hover:text-white/60 sm:text-5xl md:py-1 ${abierto ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`;
            const estilo = { transitionDelay: abierto ? `${120 + i * 70}ms` : '0ms' };
            return l.accion === 'reservar' ? (
              <button
                key={l.label}
                type="button"
                onClick={() => {
                  setAbierto(false);
                  abrirReserva();
                }}
                style={estilo}
                className={clases}
              >
                {l.label}
              </button>
            ) : (
              <Link key={l.href} href={l.href} onClick={() => setAbierto(false)} style={estilo} className={clases}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 font-display text-xs font-semibold uppercase tracking-[0.2em] md:justify-center">
          {estado === 'anonimo' && (
            <Link href="/login" onClick={() => setAbierto(false)} className="border-b border-white/60 pb-0.5 hover:border-white">
              Ingresar
            </Link>
          )}
          {estado === 'staff' && (
            <Link href="/admin" className="border-b border-white/60 pb-0.5 hover:border-white">
              Ir al panel
            </Link>
          )}
          {estado !== 'anonimo' && (
            <form action="/auth/signout" method="post">
              <button className="text-white/60 hover:text-white">Cerrar sesión</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}