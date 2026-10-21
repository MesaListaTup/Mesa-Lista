'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/reservas', label: 'Reservas' },
  { href: '/admin/mesas', label: 'Mesas' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/productos', label: 'Productos' },
];

export default function Sidebar({ perfil }) {
  const pathname = usePathname();

  return (
    <aside className="bg-tinta text-papel md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col">
      <div className="flex items-center justify-between px-5 py-4 md:block md:py-6">
        <Link href="/" className="font-display text-2xl">Mesa Lista</Link>
        <p className="hidden text-xs text-papel/60 md:mt-1 md:block">Panel del local</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
        {LINKS.map((l) => {
          const activo = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
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

      <div className="hidden border-t border-papel/15 p-4 md:block">
        <p className="truncate text-sm font-medium">{perfil.nombre ?? perfil.email}</p>
        <p className="text-xs capitalize text-papel/60">{perfil.rol}</p>
        <form action="/auth/signout" method="post" className="mt-3">
          <button className="text-xs text-papel/70 underline underline-offset-2 hover:text-papel">Cerrar sesión</button>
        </form>
      </div>
    </aside>
  );
}
