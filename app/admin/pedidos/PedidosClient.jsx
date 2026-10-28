'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio, formatHoraTS } from '@/lib/utils';
import Badge from '@/components/admin/Badge';

const CATEGORIAS = [
  { id: 'comida', titulo: 'Comida' },
  { id: 'cafeteria', titulo: 'Cafetería' },
  { id: 'bebida', titulo: 'Bebida' },
];
const SIGUIENTE = { pendiente: 'preparando', preparando: 'entregado' };
const ACCION = { pendiente: 'Pasar a preparando', preparando: 'Marcar entregado' };

export default function PedidosClient({ productos, mesas, pedidos }) {
  const supabase = createClient();
  const router = useRouter();
  const [tipo, setTipo] = useState('local');
  const [mesaId, setMesaId] = useState('');
  const [carrito, setCarrito] = useState({}); // { productoId: cantidad }
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const total = useMemo(
    () => productos.reduce((acc, p) => acc + (carrito[p.id] ?? 0) * Number(p.precio), 0),
    [carrito, productos]
  );
  const lineas = productos.filter((p) => carrito[p.id] > 0);

  function cambiar(id, delta) {
    setCarrito((c) => {
      const n = (c[id] ?? 0) + delta;
      const copia = { ...c };
      if (n <= 0) delete copia[id];
      else copia[id] = n;
      return copia;
    });
  }

  async function registrar() {
    setError('');
    if (tipo === 'local' && !mesaId) return setError('Elegí la mesa del pedido.');
    setEnviando(true);
    const { error } = await supabase.rpc('crear_pedido', {
      p_mesa_id: tipo === 'local' ? mesaId : null,
      p_tipo: tipo,
      p_items: lineas.map((p) => ({ producto_id: p.id, cantidad: carrito[p.id] })),
    });
    setEnviando(false);
    if (error) return setError(error.message);
    setCarrito({});
    router.refresh();
  }

  async function avanzar(p) {
    const { error } = await supabase.from('pedidos').update({ estado: SIGUIENTE[p.estado] }).eq('id', p.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function eliminar(p) {
    if (!confirm('¿Eliminar este pedido?')) return;
    const { error } = await supabase.from('pedidos').delete().eq('id', p.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      {/* Nuevo pedido */}
      <section className="panel space-y-5">
        <h2 className="font-semibold">Nuevo pedido</h2>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="label">Tipo</span>
            <div className="flex gap-2">
              {[['local', 'En el local'], ['para_llevar', 'Para llevar']].map(([v, t]) => (
                <button key={v} type="button" onClick={() => setTipo(v)} aria-pressed={tipo === v} className={`btn btn-sm ${tipo === v ? 'btn-dark' : 'btn-ghost'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tipo === 'local' && (
            <div>
              <label htmlFor="mesa" className="label">Mesa</label>
              <select id="mesa" value={mesaId} onChange={(e) => setMesaId(e.target.value)} className="input w-40">
                <option value="">Elegir…</option>
                {mesas.map((m) => (
                  <option key={m.id} value={m.id}>Mesa {m.numero_mesa}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {productos.length === 0 && <p className="text-sm text-tinta/60">No hay productos disponibles. Cargalos en la sección Productos.</p>}

        {CATEGORIAS.map((cat) => {
          const items = productos.filter((p) => p.categoria === cat.id);
          if (!items.length) return null;
          return (
            <div key={cat.id}>
              <h3 className="mb-2 text-sm font-semibold text-tinta/70">{cat.titulo}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((p) => (
                  <button key={p.id} type="button" onClick={() => cambiar(p.id, 1)} className="flex items-center justify-between gap-2 rounded-md border border-tinta/15 px-3 py-2 text-left text-sm hover:border-tinta">
                    <span>{p.nombre}</span>
                    <span className="shrink-0 tabular-nums text-tinta/60">{formatPrecio(p.precio)}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="rounded-md bg-tinta/5 p-4">
          {lineas.length === 0 ? (
            <p className="text-sm text-tinta/60">Tocá un producto para agregarlo al pedido.</p>
          ) : (
            <ul className="space-y-2">
              {lineas.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{p.nombre}</span>
                  <span className="flex items-center gap-2">
                    <button type="button" aria-label={`Quitar uno de ${p.nombre}`} onClick={() => cambiar(p.id, -1)} className="btn btn-ghost btn-sm w-8 px-0">−</button>
                    <span className="w-5 text-center font-semibold tabular-nums">{carrito[p.id]}</span>
                    <button type="button" aria-label={`Agregar uno de ${p.nombre}`} onClick={() => cambiar(p.id, 1)} className="btn btn-ghost btn-sm w-8 px-0">+</button>
                    <span className="w-24 text-right tabular-nums">{formatPrecio(carrito[p.id] * Number(p.precio))}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 flex justify-between border-t border-tinta/15 pt-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrecio(total)}</span>
          </p>
        </div>

        {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

        <button onClick={registrar} disabled={enviando || lineas.length === 0} className="btn btn-primary w-full py-3">
          {enviando ? 'Registrando…' : 'Registrar pedido'}
        </button>
      </section>

      {/* Pedidos de hoy */}
      <section className="space-y-3">
        <h2 className="font-semibold">Pedidos de hoy ({pedidos.length})</h2>
        {pedidos.length === 0 && <p className="panel text-sm text-tinta/60">Todavía no se registraron pedidos hoy.</p>}
        {pedidos.map((p) => (
          <article key={p.id} className="panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {p.tipo === 'local' ? `Mesa ${p.mesas?.numero_mesa ?? '—'}` : 'Para llevar'}
                </p>
                <p className="text-xs text-tinta/60">{formatHoraTS(p.created_at)} hs</p>
              </div>
              <Badge estado={p.estado} />
            </div>
            <p className="mt-2 text-sm text-tinta/80">
              {p.detalle_pedidos.map((d) => `${d.cantidad}× ${d.productos?.nombre ?? 'Producto eliminado'}`).join(', ')}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-bold tabular-nums">{formatPrecio(p.total)}</span>
              <div className="flex gap-1.5">
                {SIGUIENTE[p.estado] && (
                  <button onClick={() => avanzar(p)} className="btn btn-dark btn-sm">{ACCION[p.estado]}</button>
                )}
                <button onClick={() => eliminar(p)} className="btn btn-ghost btn-sm text-tomate">Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
