'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatHoraTS } from '@/lib/utils';

const COLUMNAS = [
  { estado: 'pendiente', titulo: 'Pendientes' },
  { estado: 'preparando', titulo: 'En preparación' },
  { estado: 'entregado', titulo: 'Entregados' },
];
const SIGUIENTE = { pendiente: 'preparando', preparando: 'entregado' };
const ACCION = { pendiente: 'Pasar a preparando', preparando: 'Marcar entregado' };
const REFRESCO_MS = 15000;

function haceCuanto(ts, ahora) {
  const min = Math.max(0, Math.floor((ahora - new Date(ts).getTime()) / 60000));
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h ${min % 60} min`;
}

export default function CocinaClient({ pedidos }) {
  const supabase = createClient();
  const router = useRouter();
  const [error, setError] = useState('');
  const [ahora, setAhora] = useState(null); // se completa en el navegador para evitar diferencias con el servidor

  // Los pedidos nuevos llegan solos: se vuelve a pedir la lista cada pocos segundos mientras la pestaña está visible
  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => {
      setAhora(Date.now());
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESCO_MS);
    return () => clearInterval(id);
  }, [router]);

  async function avanzar(p) {
    setError('');
    const { error } = await supabase.from('pedidos').update({ estado: SIGUIENTE[p.estado] }).eq('id', p.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function eliminar(p) {
    if (!confirm('¿Eliminar este pedido?')) return;
    setError('');
    const { error } = await supabase.from('pedidos').delete().eq('id', p.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

      {pedidos.length === 0 && <p className="panel text-sm text-tinta/60">Todavía no hay pedidos hoy. Los que se carguen en Caja van a aparecer acá.</p>}

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {COLUMNAS.map((col) => {
          // Pendientes y en preparación: el más viejo primero. Entregados: el más reciente primero.
          const lista = pedidos.filter((p) => p.estado === col.estado);
          if (col.estado === 'entregado') lista.reverse();
          return (
            <section key={col.estado} aria-label={col.titulo} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-tinta/70">
                {col.titulo}
                <span className="rounded-full bg-tinta/10 px-2 py-0.5 text-xs tabular-nums text-tinta">{lista.length}</span>
              </h2>

              {lista.length === 0 && <p className="rounded-lg border border-dashed border-tinta/15 p-4 text-sm text-tinta/40">Sin pedidos.</p>}

              {lista.map((p) => (
                <article key={p.id} className={`panel ${p.estado === 'entregado' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-xl leading-none">
                      {p.tipo === 'local' ? `Mesa ${p.mesas?.numero_mesa ?? '—'}` : 'Para llevar'}
                    </p>
                    <p className="text-right text-xs leading-tight text-tinta/60">
                      {formatHoraTS(p.created_at)} hs
                      {ahora && p.estado !== 'entregado' && <span className="block font-semibold text-tinta/80">{haceCuanto(p.created_at, ahora)}</span>}
                    </p>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm">
                    {p.detalle_pedidos.map((d, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="w-7 shrink-0 font-bold tabular-nums">{d.cantidad}×</span>
                        <span>{d.productos?.nombre ?? 'Producto eliminado'}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {SIGUIENTE[p.estado] && (
                      <button onClick={() => avanzar(p)} className="btn btn-dark btn-sm">{ACCION[p.estado]}</button>
                    )}
                    <button onClick={() => eliminar(p)} className="btn btn-ghost btn-sm text-tomate">Eliminar</button>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}