'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCodigo, fechaHoraAR } from '@/lib/cupones';

export default function CuponesClient() {
  const supabase = createClient();
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [cupon, setCupon] = useState(null); // resultado de la verificación
  const [noExiste, setNoExiste] = useState(false);
  const [aplicado, setAplicado] = useState(null);
  const [error, setError] = useState('');

  function limpiarResultado() {
    setCupon(null);
    setNoExiste(false);
    setAplicado(null);
    setError('');
  }

  async function verificar(e) {
    e.preventDefault();
    limpiarResultado();
    if (!codigo.trim()) return;
    setBuscando(true);
    const { data, error } = await supabase.rpc('consultar_cupon', { p_codigo: codigo });
    setBuscando(false);
    if (error) return setError(error.message);
    if (!data?.length) return setNoExiste(true);
    setCupon(data[0]);
  }

  async function aplicar() {
    setAplicando(true);
    setError('');
    const { data, error } = await supabase.rpc('usar_cupon', { p_codigo: cupon.cupon_codigo });
    setAplicando(false);
    if (error) {
      // Por ejemplo: otro mesero lo aplicó justo antes. Se vuelve a verificar para mostrar el estado real.
      setError(error.message);
      const { data: actual } = await supabase.rpc('consultar_cupon', { p_codigo: cupon.cupon_codigo });
      if (actual?.[0]) setCupon(actual[0]);
      return;
    }
    setAplicado(data?.[0] ?? null);
    setCupon(null);
    setCodigo('');
    router.refresh(); // actualiza "Últimos cupones aplicados"
  }

  return (
    <div className="space-y-4">
      <form onSubmit={verificar} className="panel flex flex-col gap-3 sm:flex-row">
        <label htmlFor="codigo-cupon" className="sr-only">Código del cupón</label>
        <input
          id="codigo-cupon"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase());
            limpiarResultado();
          }}
          className="input font-mono text-base uppercase tracking-[0.25em]"
          placeholder="Código, ej. K7M2-9QHX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
        />
        <button className="btn btn-dark sm:px-8" disabled={buscando || !codigo.trim()}>
          {buscando ? 'Verificando…' : 'Verificar'}
        </button>
      </form>

      {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

      {noExiste && (
        <p role="status" className="rounded-md bg-tomate/10 p-4 text-sm text-tomate">
          Ese código no existe. Revisá que esté bien escrito.
        </p>
      )}

      {cupon?.cupon_estado === 'usado' && (
        <div role="status" className="rounded-lg border border-limon bg-limon/20 p-5">
          <p className="font-semibold">Este cupón ya fue utilizado</p>
          <p className="mt-1 text-sm">
            {formatCodigo(cupon.cupon_codigo)} · {cupon.cupon_nombre}. Se aplicó el {fechaHoraAR(cupon.usado_at)}. No se puede aplicar de nuevo.
          </p>
        </div>
      )}

      {cupon?.cupon_estado === 'activo' && (
        <div role="status" className="rounded-lg border border-tinta/10 bg-sifon p-5">
          <p className="text-sm font-semibold uppercase tracking-wider">Cupón válido</p>
          <p className="mt-2 font-display text-4xl">Aplicá un {cupon.cupon_descuento}% de descuento</p>
          <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div><dt className="inline text-tinta/70">Cupón: </dt><dd className="inline font-medium">{cupon.cupon_nombre}</dd></div>
            <div><dt className="inline text-tinta/70">Código: </dt><dd className="inline font-mono font-medium">{formatCodigo(cupon.cupon_codigo)}</dd></div>
            <div><dt className="inline text-tinta/70">Cliente: </dt><dd className="inline font-medium">{cupon.cliente_nombre ?? 'Sin datos'}</dd></div>
            {cupon.cliente_dni && <div><dt className="inline text-tinta/70">DNI: </dt><dd className="inline font-medium">{cupon.cliente_dni}</dd></div>}
            <div><dt className="inline text-tinta/70">Canjeado: </dt><dd className="inline font-medium">{fechaHoraAR(cupon.canjeado_at)}</dd></div>
          </dl>
          <p className="mt-4 text-sm text-tinta/70">Al confirmar, el código deja de servir. El cupón sigue en el historial del cliente.</p>
          <button type="button" onClick={aplicar} disabled={aplicando} className="btn btn-primary mt-4 w-full sm:w-auto sm:px-8">
            {aplicando ? 'Aplicando…' : `Aplicar ${cupon.cupon_descuento}% y cerrar el cupón`}
          </button>
        </div>
      )}

      {aplicado && (
        <div role="status" className="rounded-lg border border-tinta/10 bg-sifon p-5">
          <p className="font-semibold">Listo: aplicá un {aplicado.cupon_descuento}% de descuento en la cuenta.</p>
          <p className="mt-1 text-sm text-tinta/70">El cupón {formatCodigo(aplicado.cupon_codigo)} ya quedó usado y no sirve más.</p>
        </div>
      )}
    </div>
  );
}
