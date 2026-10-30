'use client';

import { useState } from 'react';
import Link from 'next/link';

// Distribución: [icono hamburguesa] · [marca / links centrados] · [registro a la derecha]
// estado: 'staff' | 'cliente' | 'anon'
export default function NavbarLinks({ marca, marcaHref = '/', links, estado }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  const derecha =
    estado === 'staff' ? (
      <Link href="/admin" className="btn btn-dark btn-sm" onClick={cerrar}>Ir al panel</Link>
    ) : estado === 'cliente' ? (
      <form action="/auth/signout" method="post">
        <button className="btn btn-ghost btn-sm">Cerrar sesión</button>
      </form>
    ) : (
      <>
        <Link href="/login" className="btn btn-ghost btn-sm hidden md:inline-flex" onClick={cerrar}>Ingresar</Link>
        <Link href="/login?modo=registro" className="btn btn-primary btn-sm" onClick={cerrar}>Registrarse</Link>
      </>
    );

  return (
    <nav className="relative mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-3">
      {/* Izquierda: hamburguesa en celular, marca en escritorio */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          className="rounded-md border border-tinta/20 p-2 md:hidden"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <Link href={marcaHref} className="hidden font-display text-2xl text-tinta md:block">{marca}</Link>
      </div>

      {/* Centro: marca en celular, links en escritorio */}
      <div className="flex items-center justify-center">
        <Link href={marcaHref} className="font-display text-xl text-tinta md:hidden">{marca}</Link>
        <ul className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-tomate">{l.label}</Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Derecha: ingreso / registro */}
      <div className="flex items-center justify-end gap-2">{derecha}</div>

      {/* Menú desplegable del celular, con los elementos centrados */}
      {abierto && (
        <div className="absolute inset-x-0 top-full border-b border-tinta/10 bg-papel px-5 pb-5 pt-2 shadow-md md:hidden">
          <ul className="divide-y divide-tinta/10 text-center text-base font-medium">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={cerrar} className="block py-3">{l.label}</Link>
              </li>
            ))}
            {estado === 'anon' && (
              <li>
                <Link href="/login" onClick={cerrar} className="block py-3">Ingresar</Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
