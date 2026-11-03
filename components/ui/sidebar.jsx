'use client';

/**
 * Sidebar colapsable con animaciones (adaptado del prompt "Wensity Sidebar").
 *
 * Cambios respecto al original:
 *  - JSX en vez de TSX (el proyecto es JavaScript).
 *  - Sin @base-ui/react: `asChild` se resuelve con React.cloneElement, así
 *    podemos envolver <Link> de Next sin una dependencia extra.
 *  - Colores de Mesa Lista (tinta / papel; en el panel: grafito, blanco y negro) en lugar de tokens --primitive-*.
 *  - Sin clsx/tailwind-merge: un `cn` mínimo alcanza.
 *
 * Animaciones conservadas: colapso de ancho (240ms), píldora activa que "planea"
 * entre ítems (layoutId + spring), etiquetas con fade, grupo anidado con
 * altura animada y feedback de click (scale .97). Todo respeta
 * prefers-reduced-motion.
 */

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { IconChevronRight, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';

function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

const EASE_OUT = [0.23, 1, 0.32, 1];

/* ─── Contexto ──────────────────────────────────────────────── */

const SidebarContext = React.createContext(null);

function useSidebarContext() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('Los componentes de Sidebar deben usarse dentro de <Sidebar>');
  return ctx;
}

export function useSidebar() {
  const { collapsed, toggleCollapsed } = useSidebarContext();
  return { collapsed, toggleCollapsed };
}

/* ─── Estilos compartidos de los ítems ──────────────────────── */

const itemBase = cn(
  'group/sidebar-item relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
  'text-[13.5px] font-medium leading-none outline-none select-none whitespace-nowrap',
  '[transition:color_150ms_cubic-bezier(0.23,1,0.32,1),background-color_150ms_cubic-bezier(0.23,1,0.32,1),transform_120ms_cubic-bezier(0.23,1,0.32,1)]',
  'focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-tinta',
  'active:[transform:scale(0.97)] motion-reduce:active:[transform:none]',
  'disabled:pointer-events-none disabled:opacity-40',
);

const itemInactive = 'text-papel/70 hover:bg-papel/[0.07] hover:text-papel';
const itemActive = 'text-papel';

const pillClasses = 'pointer-events-none absolute inset-0 rounded-lg bg-papel/[0.12] shadow-[inset_0_0_0_1px_rgba(251,250,246,0.08)]';

/* ─── <Sidebar> ─────────────────────────────────────────────── */

export const Sidebar = React.forwardRef(function Sidebar(
  {
    collapsible = true,
    collapsed: controlledCollapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    width = 248,
    collapsedWidth = 72,
    className,
    style,
    children,
    'aria-label': ariaLabel = 'Navegación principal',
    ...props
  },
  ref,
) {
  const reactId = React.useId();
  const reduceMotion = useReducedMotion();

  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = collapsible ? (isControlled ? controlledCollapsed : internalCollapsed) : false;

  const toggleCollapsed = React.useCallback(() => {
    if (!collapsible) return;
    const next = !collapsed;
    if (!isControlled) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  }, [collapsible, collapsed, isControlled, onCollapsedChange]);

  const ctx = React.useMemo(
    () => ({ collapsible, collapsed, toggleCollapsed, navId: `sidebar-${reactId}` }),
    [collapsible, collapsed, toggleCollapsed, reactId],
  );

  return (
    <SidebarContext.Provider value={ctx}>
      <nav
        ref={ref}
        aria-label={ariaLabel}
        data-slot="sidebar"
        data-collapsed={collapsed ? 'true' : 'false'}
        style={{
          ...style,
          width: collapsed ? collapsedWidth : width,
          flexShrink: 0,
          // El ancho es un cambio de layout (el contenido de al lado debe
          // reacomodarse), por eso va como transición CSS interrumpible.
          transition: reduceMotion ? 'none' : 'width 240ms cubic-bezier(0.23,1,0.32,1)',
        }}
        className={cn('relative isolate flex h-full flex-col overflow-hidden bg-tinta text-papel', className)}
        {...props}
      >
        {children}
      </nav>
    </SidebarContext.Provider>
  );
});

/* ─── Etiqueta con fade (ítems / secciones) ─────────────────── */

function FadingLabel({ show, className, children }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.14, ease: EASE_OUT }}
          className={className}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* ─── <SidebarToggle> ───────────────────────────────────────── */

export const SidebarToggle = React.forwardRef(function SidebarToggle({ className, ...props }, ref) {
  const ctx = React.useContext(SidebarContext);
  if (!ctx || !ctx.collapsible) return null;
  const { collapsed, toggleCollapsed } = ctx;

  return (
    <button
      ref={ref}
      type="button"
      data-slot="sidebar-toggle"
      onClick={toggleCollapsed}
      aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
      aria-expanded={!collapsed}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg text-papel/60 outline-none',
        'hover:bg-papel/10 hover:text-papel',
        'focus-visible:ring-2 focus-visible:ring-white/70',
        '[transition:transform_120ms_cubic-bezier(0.23,1,0.32,1),color_150ms_ease,background-color_150ms_ease]',
        'active:[transform:scale(0.92)] motion-reduce:active:[transform:none]',
        className,
      )}
      {...props}
    >
      {collapsed ? (
        <IconLayoutSidebarLeftExpand className="size-[18px]" stroke={1.75} />
      ) : (
        <IconLayoutSidebarLeftCollapse className="size-[18px]" stroke={1.75} />
      )}
    </button>
  );
});

/* ─── <SidebarHeader> ───────────────────────────────────────── */

export const SidebarHeader = React.forwardRef(function SidebarHeader({ className, children, onClick, ...props }, ref) {
  const { collapsed, collapsible, toggleCollapsed } = useSidebarContext();
  const clickable = collapsed && collapsible;

  // Colapsado: el toggle no entra en el riel, así que el logo mismo expande.
  const visibleChildren = collapsed
    ? React.Children.toArray(children).filter((c) => !(React.isValidElement(c) && c.type === SidebarToggle))
    : children;

  return (
    <div
      ref={ref}
      data-slot="sidebar-header"
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? 'Expandir menú lateral' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (clickable) toggleCollapsed();
      }}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          toggleCollapsed();
        }
      }}
      className={cn(
        'flex shrink-0 items-center',
        collapsed
          ? cn(
            'flex-col justify-center gap-2 px-0 py-4',
            clickable &&
            'cursor-pointer select-none outline-none hover:bg-papel/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 [transition:background-color_150ms_ease]',
          )
          : 'h-[68px] gap-2.5 px-4',
        className,
      )}
      {...props}
    >
      {visibleChildren}
    </div>
  );
});

/* ─── <SidebarNav> (el scrollbar solo se ve mientras se scrollea) ─ */

export const SidebarNav = React.forwardRef(function SidebarNav({ className, children, onScroll, ...props }, ref) {
  const { navId } = useSidebarContext();
  const [scrolling, setScrolling] = React.useState(false);
  const timer = React.useRef(null);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div
      ref={ref}
      id={navId}
      data-slot="sidebar-nav"
      onScroll={(e) => {
        onScroll?.(e);
        setScrolling(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setScrolling(false), 700);
      }}
      className={cn('sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain py-2', scrolling && 'is-scrolling', className)}
      {...props}
    >
      {children}
    </div>
  );
});

/* ─── <SidebarSection> ──────────────────────────────────────── */

export const SidebarSection = React.forwardRef(function SidebarSection({ className, label, children, ...props }, ref) {
  const { collapsed } = useSidebarContext();
  return (
    <div ref={ref} data-slot="sidebar-section" role="group" aria-label={label} className={cn('py-1.5', className)} {...props}>
      {label && (
        <div className="flex h-7 items-end px-5 pb-1.5">
          {collapsed ? (
            <span aria-hidden="true" className="mx-auto h-px w-5 bg-papel/15" />
          ) : (
            <FadingLabel show className="whitespace-nowrap text-[10.5px] font-semibold uppercase leading-none tracking-[0.1em] text-papel/40">
              {label}
            </FadingLabel>
          )}
        </div>
      )}
      <div className="flex flex-col gap-0.5 px-3">{children}</div>
    </div>
  );
});

/* ─── Píldora activa (planea entre ítems) ───────────────────── */

function ActivePill({ navId }) {
  const reduceMotion = useReducedMotion();
  const accent = <span aria-hidden="true" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-white" />;

  if (reduceMotion) {
    return (
      <span aria-hidden="true" className={pillClasses}>
        {accent}
      </span>
    );
  }
  return (
    <motion.span
      aria-hidden="true"
      layoutId={`${navId}-active-pill`}
      transition={{ type: 'spring', stiffness: 520, damping: 42 }}
      className={pillClasses}
    >
      {accent}
    </motion.span>
  );
}

/* ─── <SidebarItem> ─────────────────────────────────────────── */

export const SidebarItem = React.forwardRef(function SidebarItem(
  { className, icon, active = false, badge, asChild = false, children, ...props },
  ref,
) {
  const { collapsed, navId } = useSidebarContext();

  const child = asChild && React.isValidElement(children) ? children : null;
  const label = child ? child.props.children : children;
  const title = collapsed && typeof label === 'string' ? label : undefined;

  const content = (
    <>
      {active ? <ActivePill navId={navId} /> : null}
      {icon ? (
        <span
          data-slot="sidebar-item-icon"
          className={cn(
            'relative z-10 flex size-5 shrink-0 items-center justify-center [transition:color_150ms_ease,transform_200ms_cubic-bezier(0.23,1,0.32,1)]',
            active ? 'text-white' : 'text-papel/55 group-hover/sidebar-item:text-papel group-hover/sidebar-item:[transform:scale(1.08)]',
          )}
        >
          {icon}
          {collapsed && badge ? (
            <span aria-hidden="true" className="absolute -right-1 -top-1 size-2 rounded-full bg-white ring-2 ring-tinta" />
          ) : null}
        </span>
      ) : null}
      <FadingLabel show={!collapsed} className="relative z-10 min-w-0 flex-1 truncate text-left">
        {label}
      </FadingLabel>
      {badge ? (
        <FadingLabel show={!collapsed} className="relative z-10 flex shrink-0 items-center">
          {badge}
        </FadingLabel>
      ) : null}
    </>
  );

  const common = {
    'data-slot': 'sidebar-item',
    'data-active': active ? 'true' : undefined,
    'aria-current': active ? 'page' : undefined,
    title,
    className: cn(itemBase, active ? itemActive : itemInactive, className),
    ...props,
  };

  if (child) {
    return React.cloneElement(child, { ref, ...common }, content);
  }

  return (
    <button ref={ref} type="button" {...common}>
      {content}
    </button>
  );
});

/* ─── <SidebarNested> (grupo desplegable) ───────────────────── */

export function SidebarNested({ icon, label, open: controlledOpen, defaultOpen = false, onOpenChange, active = false, children }) {
  const { collapsed } = useSidebarContext();
  const reduceMotion = useReducedMotion();
  const reactId = React.useId();

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const toggle = () => {
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const contentId = `sidebar-nested-${reactId}`;

  return (
    <div data-slot="sidebar-nested" className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={toggle}
        title={collapsed ? label : undefined}
        className={cn(itemBase, active && !open ? itemActive : itemInactive)}
      >
        {icon && (
          <span
            className={cn(
              'relative z-10 flex size-5 shrink-0 items-center justify-center [transition:color_150ms_ease]',
              active ? 'text-white' : 'text-papel/55 group-hover/sidebar-item:text-papel',
            )}
          >
            {icon}
          </span>
        )}
        <FadingLabel show={!collapsed} className="relative z-10 min-w-0 flex-1 truncate text-left">
          {label}
        </FadingLabel>
        <FadingLabel show={!collapsed} className="relative z-10 flex shrink-0 items-center">
          <motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
            className="flex items-center justify-center text-papel/50"
          >
            <IconChevronRight className="size-3.5" stroke={2} />
          </motion.span>
        </FadingLabel>
      </button>

      <AnimatePresence initial={false}>
        {open && !collapsed && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: reduceMotion ? 0 : 0.24, ease: EASE_OUT },
              opacity: { duration: reduceMotion ? 0 : 0.16, ease: EASE_OUT },
            }}
            className="overflow-hidden"
          >
            <div className="relative ml-[22px] flex flex-col gap-0.5 py-0.5 pl-2.5 before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-papel/15">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── <SidebarFooter> ───────────────────────────────────────── */

export const SidebarFooter = React.forwardRef(function SidebarFooter({ className, children, ...props }, ref) {
  const { collapsed } = useSidebarContext();
  return (
    <div
      ref={ref}
      data-slot="sidebar-footer"
      className={cn(
        'flex shrink-0 items-center border-t border-papel/10 py-3',
        collapsed ? 'flex-col justify-center gap-2 px-0' : 'gap-2.5 px-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});