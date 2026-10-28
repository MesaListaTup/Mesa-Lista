'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/reservas', label: 'Reservas' },
  { href: '/admin/mesas', label: 'Mesas' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/mensajes', label: 'Mensajes' },
];

export default function Sidebar({ perfil }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <aside className="bg-tinta text-papel md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col">
      <div className="flex items-center justify-between px-5 py-4 md:block md:py-6">
        <div>
          <Link href="/" className="font-display text-2xl">Mesa Lista</Link>
          <p className="hidden text-xs text-papel/60 md:mt-1 md:block">Panel del local</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-papel/30 p-2 md:hidden"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <div className={`${abierto ? 'block' : 'hidden'} md:flex md:flex-1 md:flex-col`}>
        <nav className="flex flex-col gap-1 px-3 pb-3 md:flex-1 md:pb-0">
          {LINKS.map((l) => {
            const activo = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAbierto(false)}
                aria-current={activo ? 'page' : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activo ? 'bg-papel text-tinta' : 'text-papel/80 hover:bg-papel/10'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-papel/15 p-4">
          <p className="truncate text-sm font-medium">{perfil.nombre ?? perfil.email}</p>
          <p className="text-xs capitalize text-papel/60">{perfil.rol}</p>
          <form action="/auth/signout" method="post" className="mt-3">
            <button className="text-xs text-papel/70 underline underline-offset-2 hover:text-papel">Cerrar sesión</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
