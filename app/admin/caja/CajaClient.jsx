'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/utils';
import { formatCodigo } from '@/lib/cupones';

const CATEGORIAS = [
  { id: 'comida', titulo: 'Comida' },
  { id: 'postres', titulo: 'Postres' },
  { id: 'cafeteria', titulo: 'Cafetería' },
  { id: 'bebida', titulo: 'Bebida' },
];

export default function CajaClient({ productos, mesas }) {
  const supabase = createClient();
  const [tipo, setTipo] = useState('local');
  const [mesaId, setMesaId] = useState('');
  const [carrito, setCarrito] = useState({}); // { productoId: cantidad }
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(''); // confirmación del último pedido registrado

  // Cupón de descuento del cliente
  const [codigo, setCodigo] = useState('');
  const [cupon, setCupon] = useState(null); // cupón válido aplicado al pedido
  const [errorCupon, setErrorCupon] = useState('');
  const [verificando, setVerificando] = useState(false);

  const subtotal = useMemo(
    () => productos.reduce((acc, p) => acc + (carrito[p.id] ?? 0) * Number(p.precio), 0),
    [carrito, productos]
  );
  // Mismo cálculo que hace la base de datos al registrar el pedido (ahí es donde se define el monto real)
  const descuento = cupon ? Math.round(subtotal * Number(cupon.cupon_descuento)) / 100 : 0;
  const total = subtotal - descuento;
  const lineas = productos.filter((p) => carrito[p.id] > 0);

  function cambiar(id, delta) {
    setAviso('');
    setCarrito((c) => {
      const n = (c[id] ?? 0) + delta;
      const copia = { ...c };
      if (n <= 0) delete copia[id];
      else copia[id] = n;
      return copia;
    });
  }

  async function verificarCupon(e) {
    e.preventDefault();
    setErrorCupon('');
    setAviso('');
    if (!codigo.trim()) return;
    setVerificando(true);
    const { data, error } = await supabase.rpc('consultar_cupon', { p_codigo: codigo });
    setVerificando(false);
    if (error) return setErrorCupon(error.message);
    const c = data?.[0];
    if (!c) return setErrorCupon('Ese código no existe. Revisá que esté bien escrito.');
    if (c.cupon_estado !== 'activo') return setErrorCupon('Ese cupón ya fue utilizado.');
    setCupon(c);
    setCodigo('');
  }

  function quitarCupon() {
    setCupon(null);
    setErrorCupon('');
  }

  async function registrar() {
    setError('');
    setAviso('');
    if (tipo === 'local' && !mesaId) return setError('Elegí la mesa del pedido.');
    setEnviando(true);
    const destino = tipo === 'local' ? `Mesa ${mesas.find((m) => m.id === mesaId)?.numero_mesa ?? ''}` : 'Para llevar';
    const { error } = await supabase.rpc('crear_pedido', {
      p_mesa_id: tipo === 'local' ? mesaId : null,
      p_tipo: tipo,
      p_items: lineas.map((p) => ({ producto_id: p.id, cantidad: carrito[p.id] })),
      p_cupon: cupon?.cupon_codigo ?? null,
    });
    setEnviando(false);
    if (error) {
      // Si el cupón se usó mientras tanto (otro puesto de caja), se saca del pedido para que no quede un descuento falso
      if (cupon) {
        const { data } = await supabase.rpc('consultar_cupon', { p_codigo: cupon.cupon_codigo });
        if (data?.[0]?.cupon_estado !== 'activo') {
          setCupon(null);
          return setError('El cupón ya fue utilizado, así que se quitó del pedido. No se registró nada: revisá el total y volvé a registrar.');
        }
      }
      return setError(error.message);
    }
    setAviso(
      `Pedido registrado: ${destino} · ${formatPrecio(total)}.` +
      (cupon ? ` Se aplicó el ${cupon.cupon_descuento}% del cupón ${formatCodigo(cupon.cupon_codigo)}, que ya no sirve más.` : '')
    );
    setCarrito({});
    setMesaId('');
    setCupon(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] xl:items-start">
      {/* Armado del pedido */}
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
              <select id="mesa" value={mesaId} onChange={(e) => { setMesaId(e.target.value); setAviso(''); }} className="input w-40">
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
      </section>

      {/* Ticket del pedido */}
      <section className="panel space-y-4 xl:sticky xl:top-6">
        <h2 className="font-semibold">
          {tipo === 'local' ? `Pedido · ${mesaId ? `Mesa ${mesas.find((m) => m.id === mesaId)?.numero_mesa}` : 'sin mesa'}` : 'Pedido · para llevar'}
        </h2>

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
          <dl className="mt-3 space-y-1 border-t border-tinta/15 pt-3 text-sm">
            {cupon && (
              <>
                <div className="flex justify-between">
                  <dt className="text-tinta/70">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrecio(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-tinta/70">Descuento {cupon.cupon_descuento}%</dt>
                  <dd className="tabular-nums">−{formatPrecio(descuento)}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrecio(total)}</dd>
            </div>
          </dl>
        </div>

        {/* Cupón de descuento del cliente */}
        <div>
          <span className="label">Cupón de descuento</span>
          {cupon ? (
            <div className="flex items-start justify-between gap-3 rounded-md border border-tinta/15 bg-sifon p-3 text-sm">
              <div>
                <p className="font-semibold">{cupon.cupon_descuento}% · {cupon.cupon_nombre}</p>
                <p className="text-xs text-tinta/70">
                  <span className="font-mono tracking-wider">{formatCodigo(cupon.cupon_codigo)}</span>
                  {cupon.cliente_nombre ? ` · ${cupon.cliente_nombre}` : ''}
                </p>
                <p className="mt-1 text-xs text-tinta/70">Se consume al registrar el pedido.</p>
              </div>
              <button type="button" onClick={quitarCupon} className="btn btn-ghost btn-sm shrink-0">Quitar</button>
            </div>
          ) : (
            <form onSubmit={verificarCupon} className="flex gap-2">
              <input
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value.toUpperCase());
                  setErrorCupon('');
                }}
                aria-label="Código del cupón"
                className="input font-mono uppercase tracking-[0.2em]"
                placeholder="K7M2-9QHX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={12}
              />
              <button className="btn btn-ghost shrink-0" disabled={verificando || !codigo.trim()}>
                {verificando ? 'Verificando…' : 'Aplicar'}
              </button>
            </form>
          )}
          {errorCupon && <p role="alert" className="mt-2 text-sm text-tomate">{errorCupon}</p>}
        </div>

        {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}
        {aviso && (
          <p role="status" className="rounded-md bg-tinta/5 p-3 text-sm">
            {aviso} Ya está en <Link href="/admin/cocina" className="font-semibold underline underline-offset-2">Cocina</Link>.
          </p>
        )}

        <button onClick={registrar} disabled={enviando || lineas.length === 0} className="btn btn-primary w-full py-3">
          {enviando ? 'Registrando…' : 'Registrar y enviar a cocina'}
        </button>
      </section>
    </div>
  );
}