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
  { href: '/beneficios', label: 'Beneficios' },
  { href: '/#historia', label: 'Quiénes somos' },
  { href: '/#visitanos', label: 'Dónde estamos' },
  { href: '/#contacto', label: 'Contacto' },
];

const subrayado = 'border-b border-white/60 pb-0.5 hover:border-white';

// Íconos de línea (24x24) que heredan el color del texto
const propsIcono = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'h-6 w-6',
};
const IconoUsuario = () => (
  <svg {...propsIcono}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c.9-3.6 3.8-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
  </svg>
);
const IconoEngranaje = () => (
  <svg {...propsIcono}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
  </svg>
);

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

  // La tipografía manuscrita tiene la tinta corrida hacia arriba dentro de su caja de texto,
  // por eso se baja un poco (translate-y en em, escala con el tamaño) para que quede centrada
  // verticalmente respecto al botón hamburguesa / la X.
  // Es una función y no un componente para que React no lo vuelva a montar en cada render.
  const logo = (className = '', alHacerClic) => (
    <Link
      href="/"
      onClick={alHacerClic}
      className={`${firma.className} block translate-y-[0.12em] leading-none text-white ${className}`}
      aria-label={`${nombre}, inicio`}
    >
      {nombre}
    </Link>
  );

  const esAnonimo = estado === 'anonimo';
  const esAdmin = estado === 'admin';
  const cerrar = () => setAbierto(false);
  const clasesIcono = 'flex h-11 w-11 items-center justify-center text-white transition-opacity hover:opacity-60';

  return (
    <>
      <header
        className={`hero-fade-in fixed inset-x-0 top-0 z-40 transition-all duration-500 ${solida ? 'border-b border-white/10 bg-black/80 backdrop-blur-md' : 'border-b border-transparent'
          }`}
        style={{ animationDelay: '300ms' }}
      >
        <nav
          aria-label="Principal"
          className={`mx-auto grid max-w-[1600px] grid-cols-[1fr_auto] items-center px-6 transition-all duration-500 md:px-14 xl:grid-cols-[1fr_auto_1fr] ${solida ? 'py-2' : 'py-5 md:py-7'
            }`}
        >
          {logo('text-4xl md:text-5xl justify-self-start')}

          {/* Escritorio: enlaces al centro */}
          <ul className="hidden items-center gap-8 xl:flex">
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
                    className={`relative inline-block whitespace-nowrap pb-1.5 font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-white after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:bg-white/80 after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100 ${activo ? 'after:scale-x-100' : 'after:scale-x-0'
                      }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Accesos de cuenta + CTA. En celular quedan siempre visibles (usuario y engranaje) sin abrir el menú;
              en escritorio el usuario se muestra como texto y aparece el botón RESERVAR. */}
          <div className="flex items-center justify-self-end xl:gap-2">
            <Link
              href={esAnonimo ? '/login' : '/perfil'}
              aria-label={esAnonimo ? 'Ingresar' : 'Mi perfil'}
              aria-current={pathname === '/perfil' ? 'page' : undefined}
              className={`${clasesIcono} xl:w-auto xl:gap-0 xl:px-3`}
            >
              <span className="xl:hidden"><IconoUsuario /></span>
              <span className="hidden font-display text-[13px] font-semibold uppercase tracking-[0.12em] xl:inline">
                {esAnonimo ? 'Ingresar' : 'Mi perfil'}
              </span>
            </Link>

            {/* Solo administradores. La ruta /admin además se valida en el servidor (middleware + layout) */}
            {esAdmin && (
              <Link href="/admin" aria-label="Administración" title="Administración" className={clasesIcono}>
                <IconoEngranaje />
              </Link>
            )}

            {/* Único CTA principal del navbar de escritorio */}
            <button
              type="button"
              onClick={abrirReserva}
              className="ml-2 hidden rounded-md bg-white px-6 py-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-white/85 xl:block"
            >
              Reservar
            </button>

            <button
              ref={botonRef}
              type="button"
              onClick={() => setAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={abierto}
              aria-controls="menu-principal"
              className="group flex h-11 w-11 flex-col items-end justify-center gap-[7px] xl:hidden"
            >
              <span className="h-[3px] w-8 bg-white transition-all group-hover:w-6" />
              <span className="h-[3px] w-8 bg-white" />
              <span className="h-[3px] w-8 bg-white transition-all group-hover:w-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Menú a pantalla completa (celular y tablet). Jerarquía: 1) RESERVAR MESA, 2) navegación, 3) cuenta */}
      <div
        id="menu-principal"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        aria-hidden={!abierto}
        className={`fixed inset-0 z-50 flex flex-col bg-black/95 px-6 py-5 text-white backdrop-blur-md transition-[opacity,visibility] duration-300 md:px-14 md:py-7 xl:hidden ${abierto ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
      >
        <div className="flex shrink-0 items-center justify-between">
          {logo('text-4xl md:text-5xl', cerrar)}
          <div className="flex items-center">
            <Link href={esAnonimo ? '/login' : '/perfil'} onClick={cerrar} aria-label={esAnonimo ? 'Ingresar' : 'Mi perfil'} className={clasesIcono}>
              <IconoUsuario />
            </Link>
            {esAdmin && (
              <Link href="/admin" onClick={cerrar} aria-label="Administración" className={clasesIcono}>
                <IconoEngranaje />
              </Link>
            )}
            <button ref={cerrarRef} type="button" onClick={cerrarConFoco} aria-label="Cerrar menú" className="flex h-11 w-11 items-center justify-center">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-y-auto pb-2 pt-8">
          {/* 1. CTA principal, grande y separado del resto */}
          <button
            type="button"
            onClick={() => {
              cerrar();
              abrirReserva();
            }}
            style={{ transitionDelay: abierto ? '100ms' : '0ms' }}
            className={`w-full shrink-0 rounded-xl bg-white px-6 py-5 font-display text-xl uppercase tracking-[0.14em] text-black transition-all duration-500 hover:bg-white/85 sm:text-2xl ${abierto ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
          >
            Reservar mesa
          </button>

          {/* 2. Navegación */}
          <nav aria-label="Secciones" className="mt-10 flex flex-1 flex-col items-center justify-center gap-1 text-center">
            {LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={cerrar}
                style={{ transitionDelay: abierto ? `${180 + i * 60}ms` : '0ms' }}
                className={`py-1.5 font-display text-2xl text-white/90 transition-all duration-500 hover:text-white/60 sm:text-3xl ${abierto ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* 3. Cuenta (acceso secundario) */}
          <div className="mt-8 flex shrink-0 flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/15 pt-6 font-display text-xs font-semibold uppercase tracking-[0.2em]">
            {esAnonimo && (
              <>
                <Link href="/login" onClick={cerrar} className={subrayado}>Ingresar</Link>
                <Link href="/login?modo=registro" onClick={cerrar} className={subrayado}>Registrarme</Link>
              </>
            )}
            {!esAnonimo && <Link href="/perfil" onClick={cerrar} className={subrayado}>Mi perfil</Link>}
            {esAdmin && <Link href="/admin" onClick={cerrar} className={subrayado}>Administración</Link>}
            {!esAnonimo && (
              <form action="/auth/signout" method="post">
                <button className="text-white/60 hover:text-white">Cerrar sesión</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
