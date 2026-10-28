'use client';

import { useState } from 'react';
import Link from 'next/link';

const LINKS = [
  { href: '#menu', label: 'Menú' },
  { href: '#historia', label: 'Nuestra historia' },
  { href: '#visitanos', label: 'Dónde encontrarnos' },
  { href: '#contacto', label: 'Contacto' },
];

// estado: 'staff' | 'cliente' | 'anon'
export default function NavbarLinks({ estado }) {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  const accion =
    estado === 'staff' ? (
      <Link href="/admin" className="btn btn-dark btn-sm" onClick={cerrar}>Ir al panel</Link>
    ) : estado === 'cliente' ? (
      <form action="/auth/signout" method="post">
        <button className="btn btn-ghost btn-sm">Cerrar sesión</button>
      </form>
    ) : (
      <Link href="/login" className="btn btn-ghost btn-sm" onClick={cerrar}>Ingresar</Link>
    );

  return (
    <>
      {/* Escritorio */}
      <div className="hidden items-center gap-6 text-sm font-medium md:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-tomate">{l.label}</a>
        ))}
        {accion}
      </div>

      {/* Celular: botón hamburguesa */}
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

      {abierto && (
        <div className="absolute inset-x-0 top-full border-b border-tinta/10 bg-papel px-5 pb-5 pt-2 shadow-md md:hidden">
          <ul className="divide-y divide-tinta/10 text-base font-medium">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={cerrar} className="block py-3">{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="mt-4">{accion}</div>
        </div>
      )}
    </>
  );
}
