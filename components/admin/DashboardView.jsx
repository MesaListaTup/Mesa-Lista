'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MotionConfig, animate, motion, useReducedMotion } from 'framer-motion';
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCalendarEvent,
  IconClock,
  IconReceipt2,
  IconTable,
} from '@tabler/icons-react';
import Badge from '@/components/admin/Badge';
import { formatHora, formatPrecio } from '@/lib/utils';

const EASE = [0.23, 1, 0.32, 1];

const contenedor = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const aparece = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`;

/* ─── Número que "cuenta" hasta su valor ───────────────────── */

function Numero({ valor, formato }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? valor : 0);

  useEffect(() => {
    if (reduce) {
      setV(valor);
      return undefined;
    }
    const controles = animate(0, valor, { duration: 0.9, ease: EASE, onUpdate: setV });
    return () => controles.stop();
  }, [valor, reduce]);

  const r = Math.round(v);
  return <span className="tabular-nums">{formato === 'precio' ? formatPrecio(r) : r}</span>;
}

/* ─── Tarjeta de indicador ─────────────────────────────────── */

function Tarjeta({ titulo, href, icono, tono, resaltar, children, pie }) {
  return (
    <motion.div variants={aparece}>
      <Link
        href={href}
        className={`panel group relative block h-full overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(28,29,33,0.35)] active:scale-[0.985] ${resaltar ? 'border-limon bg-limon/20' : 'hover:border-tinta/25'
          }`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tono}`}>{icono}</span>
          <p className="min-w-0 flex-1 text-sm font-medium leading-tight text-tinta/70">{titulo}</p>
          {resaltar ? (
            <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tinta/40" />
              <span className="relative inline-flex size-2.5 rounded-full bg-tinta" />
            </span>
          ) : (
            <IconArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-tinta/30 opacity-0 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" stroke={2} />
          )}
        </div>
        <p className="mt-2 text-[1.65rem] font-bold leading-tight">{children}</p>
        {pie}
      </Link>
    </motion.div>
  );
}

/* ─── Gráfico de área: reservas por día ────────────────────── */

const GW = 700;
const GH = 250;
const PT = 28;
const PB = 14;

function GraficoReservas({ porDia }) {
  const [activo, setActivo] = useState(0);
  const n = porDia.length;
  const maxVal = Math.max(4, ...porDia.map((d) => d.total));
  const x = (i) => ((i + 0.5) * GW) / n;
  const y = (v) => PT + (1 - v / maxVal) * (GH - PT - PB);

  const puntos = porDia.map((d, i) => [x(i), y(d.total)]);
  const linea = puntos.reduce((acc, [px, py], i) => {
    if (i === 0) return `M ${px} ${py}`;
    const [qx, qy] = puntos[i - 1];
    const cx = (qx + px) / 2;
    return `${acc} C ${cx} ${qy}, ${cx} ${py}, ${px} ${py}`;
  }, '');
  const area = `${linea} L ${x(n - 1)} ${GH - PB} L ${x(0)} ${GH - PB} Z`;

  const sel = porDia[activo];
  const columnas = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <h2 className="font-semibold">Reservas de los próximos 7 días</h2>
          <p className="mt-1 text-xs text-tinta/60">Pasá el cursor (o tocá) sobre un día para ver el detalle.</p>
        </div>
        <div className="text-right" aria-live="polite">
          <p className="text-3xl font-bold leading-none tabular-nums">{sel.total}</p>
          <p className="mt-1 text-xs text-tinta/60 first-letter:uppercase">
            {plural(sel.total, 'reserva', 'reservas')} · {sel.largo}
          </p>
        </div>
      </div>

      <div className="relative mt-5">
        <svg viewBox={`0 0 ${GW} ${GH}`} className="block h-auto w-full" role="img" aria-label="Gráfico de reservas por día">
          <defs>
            <linearGradient id="grad-reservas" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'rgb(var(--tinta))', stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(var(--tinta))', stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((k) => {
            const gy = PT + (k / 3) * (GH - PT - PB);
            return <line key={k} x1="0" x2={GW} y1={gy} y2={gy} className="stroke-tinta/10" strokeDasharray="4 6" />;
          })}

          <motion.path d={area} fill="url(#grad-reservas)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} />
          <motion.path
            d={linea}
            fill="none"
            className="stroke-tinta"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
          />

          {puntos.map(([px, py], i) => (
            <motion.circle
              key={porDia[i].dia}
              cx={px}
              cy={py}
              r="4"
              className="fill-tinta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
            />
          ))}

          {/* Guía y punto del día seleccionado: se deslizan entre días */}
          <motion.line
            y1={PT - 10}
            y2={GH - PB}
            className="stroke-tinta/30"
            strokeDasharray="3 4"
            initial={false}
            animate={{ x1: x(activo), x2: x(activo) }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          />
          <motion.circle
            r="8"
            className="fill-white stroke-tinta"
            strokeWidth="3.5"
            initial={false}
            animate={{ cx: x(activo), cy: y(sel.total) }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          />
        </svg>

        <div className="absolute inset-0 grid" style={columnas}>
          {porDia.map((d, i) => (
            <button
              key={d.dia}
              type="button"
              aria-label={`${d.largo}: ${plural(d.total, 'reserva', 'reservas')}`}
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onClick={() => setActivo(i)}
              className="h-full cursor-pointer rounded-md outline-none focus-visible:bg-tinta/5"
            />
          ))}
        </div>
      </div>

      <div className="mt-2 grid text-center text-[11px] capitalize" style={columnas}>
        {porDia.map((d, i) => (
          <div key={d.dia} className={`transition-colors duration-150 ${activo === i ? 'text-tinta' : 'text-tinta/50'}`}>
            <span className="block">{i === 0 ? 'Hoy' : d.etiqueta}</span>
            <span className="block text-xs font-semibold tabular-nums">{d.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Estado de las mesas ──────────────────────────────────── */

const MESAS = {
  libre: { texto: 'Libres', color: 'bg-tinta/25' },
  reservada: { texto: 'Reservadas', color: 'bg-tinta/55' },
  ocupada: { texto: 'Ocupadas', color: 'bg-tinta' },
  inactiva: { texto: 'Inactivas', color: 'bg-tinta/10' },
};

function EstadoMesas({ estados }) {
  const total = estados.reduce((acc, e) => acc + e.cantidad, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Estado de las mesas</h2>
        <Link href="/admin/mesas" className="group inline-flex items-center gap-1 text-xs font-semibold text-tinta/60 transition-colors hover:text-tinta">
          Ver mesas
          <IconArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" stroke={2} aria-hidden="true" />
        </Link>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-tinta/60">Todavía no hay mesas cargadas.</p>
      ) : (
        <>
          <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-papel ring-1 ring-inset ring-tinta/10" role="img" aria-label="Distribución de mesas por estado">
            {estados.map((e, i) =>
              e.cantidad > 0 ? (
                <motion.div
                  key={e.estado}
                  className={`h-full first:rounded-l-full last:rounded-r-full ${MESAS[e.estado].color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(e.cantidad / total) * 100}%` }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.3 + i * 0.08 }}
                />
              ) : null,
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
            {estados.map((e) => (
              <div key={e.estado} className="flex items-center gap-2 text-sm">
                <span className={`size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-tinta/15 ${MESAS[e.estado].color}`} aria-hidden="true" />
                <dt className="text-tinta/70">{MESAS[e.estado].texto}</dt>
                <dd className="ml-auto font-semibold tabular-nums">{e.cantidad}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  );
}

/* ─── Agenda de hoy ────────────────────────────────────────── */

const lista = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } };
const fila = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } } };

function Agenda({ agenda }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          Agenda de hoy
          {agenda.length > 0 && (
            <span className="rounded-full bg-tinta/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums">{agenda.length}</span>
          )}
        </h2>
        <Link href="/admin/reservas" className="group inline-flex items-center gap-1 text-xs font-semibold text-tinta/60 transition-colors hover:text-tinta">
          Ver todo
          <IconArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" stroke={2} aria-hidden="true" />
        </Link>
      </div>

      {agenda.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-tinta/5 text-tinta/40">
            <IconCalendarEvent className="size-6" stroke={1.5} aria-hidden="true" />
          </span>
          <p className="text-sm text-tinta/60">No hay reservas para hoy.</p>
        </div>
      ) : (
        <motion.ul variants={lista} initial="hidden" animate="show" className="mt-3 space-y-1.5 xl:max-h-[34rem] xl:overflow-y-auto">
          {agenda.map((r) => (
            <motion.li
              key={r.id}
              variants={fila}
              className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-sm transition-colors duration-150 hover:border-tinta/10 hover:bg-papel"
            >
              <span className="w-14 shrink-0 rounded-md bg-tinta py-1 text-center text-xs font-semibold tabular-nums text-papel">
                {formatHora(r.hora)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.nombre}</p>
                <p className="truncate text-xs text-tinta/60">
                  {plural(r.personas, 'persona', 'personas')}
                  {r.mesa ? ` · mesa ${r.mesa}` : ''}
                </p>
              </div>
              <Badge estado={r.estado} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

/* ─── Vista principal ──────────────────────────────────────── */

export default function DashboardView({ saludo, nombre, fechaHoy, stats, porDia, estadosMesas, agenda }) {
  const resumen =
    stats.reservasHoy === 0
      ? 'Hoy todavía no hay reservas.'
      : `Hoy hay ${plural(stats.reservasHoy, 'reserva', 'reservas')}.`;
  const aviso = stats.pendientes > 0 ? ` Tenés ${plural(stats.pendientes, 'reserva', 'reservas')} por confirmar en los próximos 7 días.` : '';

  const ocupacion = stats.mesasActivas > 0 ? Math.min(100, (stats.mesasOcupadas / stats.mesasActivas) * 100) : 0;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={contenedor} initial="hidden" animate="show" className="mx-auto max-w-[1400px] space-y-6">
        {/* Encabezado */}
        <motion.section variants={aparece} className="relative overflow-hidden rounded-2xl bg-tinta p-6 text-papel md:p-8">
          <div
            aria-hidden="true"
            className="gingham pointer-events-none absolute inset-0 opacity-[0.07] [mask-image:linear-gradient(to_left,black,transparent_75%)]"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-papel/55 first-letter:uppercase">{fechaHoy}</p>
              <h1 className="mt-2 font-display text-3xl md:text-4xl">
                {saludo}
                {nombre ? `, ${nombre}` : ''}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-papel/75">
                {resumen}
                {aviso}
              </p>
              <div className="mt-5 border-t border-papel/15 pt-4 lg:mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-papel/55">Ventas de hoy</p>
                <p className="mt-1 text-3xl font-bold leading-none tracking-tight text-papel sm:text-4xl"><Numero valor={stats.ventas} formato="precio" /></p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/admin/reservas"
                className="group inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-tinta transition duration-150 hover:bg-papel active:scale-[0.97]"
              >
                Ver reservas
                <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" stroke={2} aria-hidden="true" />
              </Link>
              <Link
                href="/admin/mesas"
                className="group inline-flex items-center gap-2 rounded-md border border-papel/25 px-4 py-2.5 text-sm font-semibold text-papel transition duration-150 hover:bg-papel/10 active:scale-[0.97]"
              >
                Gestionar mesas
                <IconArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" stroke={2} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Indicadores */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Tarjeta titulo="Reservas de hoy" href="/admin/reservas" icono={<IconCalendarEvent className="size-5" stroke={1.75} />} tono="bg-tinta/[0.07] text-tinta">
            <Numero valor={stats.reservasHoy} />
          </Tarjeta>

          <Tarjeta
            titulo="Por confirmar (7 días)"
            href="/admin/reservas"
            icono={<IconClock className="size-5" stroke={1.75} />}
            tono="bg-limon/60 text-tinta"
            resaltar={stats.pendientes > 0}
          >
            <Numero valor={stats.pendientes} />
          </Tarjeta>

          <Tarjeta
            titulo="Mesas ocupadas"
            href="/admin/mesas"
            icono={<IconTable className="size-5" stroke={1.75} />}
            tono="bg-tinta/[0.07] text-tinta"
            pie={
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-tinta/10">
                  <motion.div
                    className="h-full rounded-full bg-tinta"
                    initial={{ width: 0 }}
                    animate={{ width: `${ocupacion}%` }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-tinta/60">de {stats.mesasActivas} activas</p>
              </div>
            }
          >
            <Numero valor={stats.mesasOcupadas} />
          </Tarjeta>

          <Tarjeta titulo="Pedidos de hoy" href="/admin/pedidos" icono={<IconReceipt2 className="size-5" stroke={1.75} />} tono="bg-tinta/[0.07] text-tinta">
            <Numero valor={stats.pedidos} />
          </Tarjeta>

        </div>

        {/* Gráfico + mesas | agenda */}
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-6 xl:col-span-3">
            <motion.section variants={aparece} className="panel">
              <GraficoReservas porDia={porDia} />
            </motion.section>
            <motion.section variants={aparece} className="panel">
              <EstadoMesas estados={estadosMesas} />
            </motion.section>
          </div>
          <motion.section variants={aparece} className="panel xl:col-span-2">
            <Agenda agenda={agenda} />
          </motion.section>
        </div>
      </motion.div>
    </MotionConfig>
  );
}