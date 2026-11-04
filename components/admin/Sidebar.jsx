'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  IconCalendarEvent,
<<<<<<< HEAD
  IconCash,
  IconChefHat,
=======
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f
  IconCode,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconMessage,
<<<<<<< HEAD
=======
  IconReceipt2,
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f
  IconTable,
  IconTicket,
  IconToolsKitchen2,
  IconX,
} from '@tabler/icons-react';
import {
  Sidebar as UiSidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarNav,
  SidebarNested,
  SidebarSection,
  SidebarToggle,
  useSidebar,
} from '@/components/ui/sidebar';

const ICON = 'size-[18px]';
const STORAGE_KEY = 'mesa-lista:sidebar-colapsado';

// `badge` apunta a una clave del objeto `contadores` que llega del layout.
const SECCIONES = [
  {
    label: 'Operación',
    items: [
      { href: '/admin', label: 'Resumen', icon: <IconLayoutDashboard className={ICON} stroke={1.75} /> },
      { href: '/admin/reservas', label: 'Reservas', icon: <IconCalendarEvent className={ICON} stroke={1.75} />, badge: 'reservas' },
      { href: '/admin/mesas', label: 'Mesas', icon: <IconTable className={ICON} stroke={1.75} /> },
<<<<<<< HEAD
      { href: '/admin/caja', label: 'Caja', icon: <IconCash className={ICON} stroke={1.75} /> },
      { href: '/admin/cocina', label: 'Cocina', icon: <IconChefHat className={ICON} stroke={1.75} />, badge: 'cocina' },
=======
      { href: '/admin/pedidos', label: 'Pedidos', icon: <IconReceipt2 className={ICON} stroke={1.75} /> },
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        label: 'Carta y promos',
        icon: <IconToolsKitchen2 className={ICON} stroke={1.75} />,
        hijos: [
          { href: '/admin/productos', label: 'Productos' },
          { href: '/admin/cupones', label: 'Cupones' },
        ],
      },
      { href: '/admin/mensajes', label: 'Mensajes', icon: <IconMessage className={ICON} stroke={1.75} />, badge: 'mensajes' },
    ],
  },
  {
    label: 'Equipo',
    items: [{ href: '/admin/desarrolladores', label: 'Desarrolladores', icon: <IconCode className={ICON} stroke={1.75} /> }],
  },
];

function esActivo(pathname, href) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function Contador({ valor }) {
  if (!valor) return undefined;
  return (
    <span className="min-w-[20px] rounded-full bg-white px-1.5 py-[3px] text-center text-[10.5px] font-bold leading-none text-tinta tabular-nums">
      {valor > 99 ? '99+' : valor}
    </span>
  );
}

function Marca() {
  const { collapsed } = useSidebar();
  // Colapsado: el header completo funciona como botón para expandir, así que el logo no navega.
  if (collapsed) {
    return <span className="flex size-8 items-center justify-center rounded-lg bg-white font-display text-[15px] text-tinta">M</span>;
  }
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/70" title="Ir a la web">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white font-display text-[15px] text-tinta">M</span>
      <span className="min-w-0 leading-none">
        <span className="block truncate font-display text-[17px]">Mesa Lista</span>
        <span className="mt-1 block text-[10.5px] uppercase tracking-[0.1em] text-papel/45">Panel del local</span>
      </span>
    </Link>
  );
}

function Navegacion({ pathname, contadores, onNavigate }) {
  return (
    <SidebarNav>
      {SECCIONES.map((seccion) => (
        <SidebarSection key={seccion.label} label={seccion.label}>
          {seccion.items.map((item) => {
            if (item.hijos) {
              const activo = item.hijos.some((h) => esActivo(pathname, h.href));
              return (
                <SidebarNested key={item.label} icon={item.icon} label={item.label} active={activo} defaultOpen={activo}>
                  {item.hijos.map((h) => (
                    <SidebarItem key={h.href} active={esActivo(pathname, h.href)} asChild onClick={onNavigate}>
                      <Link href={h.href}>{h.label}</Link>
                    </SidebarItem>
                  ))}
                </SidebarNested>
              );
            }
            return (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                active={esActivo(pathname, item.href)}
                badge={item.badge ? <Contador valor={contadores?.[item.badge]} /> : undefined}
                asChild
                onClick={onNavigate}
              >
                <Link href={item.href}>{item.label}</Link>
              </SidebarItem>
            );
          })}
        </SidebarSection>
      ))}
    </SidebarNav>
  );
}

function Usuario({ perfil }) {
  const { collapsed } = useSidebar();
  const nombre = perfil.nombre ?? perfil.email ?? '';
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?';

  const salir = (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="flex size-8 items-center justify-center rounded-lg text-papel/60 outline-none [transition:transform_120ms_cubic-bezier(0.23,1,0.32,1),color_150ms_ease,background-color_150ms_ease] hover:bg-papel/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:[transform:scale(0.92)]"
      >
        <IconLogout className="size-[18px]" stroke={1.75} />
      </button>
    </form>
  );

  return (
    <>
      <span
        title={collapsed ? `${nombre} · ${perfil.rol}` : undefined}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-papel text-[13px] font-bold text-tinta"
      >
        {inicial}
      </span>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium leading-tight">{nombre}</p>
          <p className="truncate text-[11px] leading-tight text-papel/50">{perfil.email}</p>
        </div>
      )}
      {salir}
    </>
  );
}

function ContenidoSidebar({ perfil, contadores, pathname, onNavigate, conToggle }) {
  return (
    <>
      <SidebarHeader>
        <Marca />
        {conToggle ? <SidebarToggle className="ml-auto" /> : null}
      </SidebarHeader>
      <Navegacion pathname={pathname} contadores={contadores} onNavigate={onNavigate} />
      <SidebarFooter>
        <Usuario perfil={perfil} />
      </SidebarFooter>
    </>
  );
}

export default function Sidebar({ perfil, contadores }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [abierto, setAbierto] = useState(false);
  const [colapsado, setColapsado] = useState(false);

  // Recordar si el usuario prefiere el menú colapsado (el almacenamiento puede no estar disponible).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setColapsado(true);
    } catch { }
  }, []);

  const cambiarColapsado = (v) => {
    setColapsado(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch { }
  };

  // Cerrar el menú mobile con Escape y bloquear el scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('keydown', onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto]);

<<<<<<< HEAD
  const total = (contadores?.reservas ?? 0) + (contadores?.mensajes ?? 0) + (contadores?.cocina ?? 0);
=======
  const total = (contadores?.reservas ?? 0) + (contadores?.mensajes ?? 0);
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f

  return (
    <>
      {/* Escritorio: menú lateral colapsable */}
      <div className="sticky top-0 hidden h-screen shrink-0 md:block">
        <UiSidebar collapsed={colapsado} onCollapsedChange={cambiarColapsado} width={256} collapsedWidth={72} aria-label="Navegación del panel">
          <ContenidoSidebar perfil={perfil} contadores={contadores} pathname={pathname} conToggle />
        </UiSidebar>
      </div>

      {/* Mobile: barra superior + cajón deslizable */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-tinta px-4 py-3 text-papel md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white font-display text-[15px] text-tinta">M</span>
          <span className="font-display text-lg">Mesa Lista</span>
        </Link>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-lg border border-papel/20 outline-none [transition:transform_120ms_cubic-bezier(0.23,1,0.32,1),background-color_150ms_ease] hover:bg-papel/10 focus-visible:ring-2 focus-visible:ring-white/70 active:[transform:scale(0.94)]"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          onClick={() => setAbierto(true)}
        >
          <IconMenu2 className="size-5" stroke={1.75} />
          {total > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full bg-white ring-2 ring-tinta" />}
        </button>
      </header>

      <AnimatePresence>
        {abierto && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-tinta/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              onClick={() => setAbierto(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-[288px] max-w-[85vw]"
              initial={{ x: reduceMotion ? 0 : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: reduceMotion ? 0 : '-100%' }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
              <UiSidebar collapsible={false} width={288} className="!w-full" aria-label="Navegación del panel">
                <ContenidoSidebar perfil={perfil} contadores={contadores} pathname={pathname} onNavigate={() => setAbierto(false)} />
              </UiSidebar>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setAbierto(false)}
                className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-lg text-papel/60 outline-none hover:bg-papel/10 hover:text-papel focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <IconX className="size-[18px]" stroke={1.75} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}