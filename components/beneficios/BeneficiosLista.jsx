'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCodigo } from '@/lib/cupones';
import Reveal from '@/components/landing/Reveal';

const etiqueta = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';
const botonBase =
  'w-full border px-6 py-3 text-[12px] font-medium uppercase tracking-[0.3em] transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-40';
const botonPrincipal = `${botonBase} border-white/70 text-white hover:bg-white hover:text-black`;

// puntos = null cuando no hay sesión iniciada
export default function BeneficiosLista({ beneficios, puntos }) {
  const supabase = createClient();
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(null); // id del beneficio que espera confirmación
  const [canjeando, setCanjeando] = useState(null);
  const [error, setError] = useState('');
  const [canje, setCanje] = useState(null); // último cupón canjeado
  const panelRef = useRef(null);

  // Al canjear, lleva la vista al cupón recién generado
  useEffect(() => {
    if (canje) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [canje]);

  async function canjear(id) {
    setError('');
    setCanjeando(id);
    const { data, error } = await supabase.rpc('canjear_beneficio', { p_beneficio_id: id });
    setCanjeando(null);
    setConfirmando(null);
    if (error) return setError(error.message);
    setCanje(data?.[0] ?? null);
    router.refresh(); // actualiza los puntos que se muestran
  }

  return (
    <div>
      {canje && (
        <div ref={panelRef} role="status" className="mb-8 rounded-2xl border border-white/30 bg-white/10 p-7 text-center md:p-10">
          <p className={etiqueta}>¡Canje realizado!</p>
          <p className="mt-4 text-lg text-white/80">Tu cupón: {canje.cupon_nombre}</p>
          <p className="mt-3 font-mono text-4xl tracking-[0.25em] sm:text-5xl">{formatCodigo(canje.cupon_codigo)}</p>
          <p className="mx-auto mt-5 max-w-lg text-white/75">
            Mostrale este código al mesero cuando estés en el local. Lo guardamos en tu perfil, en{' '}
            <Link href="/perfil" className="underline underline-offset-4 hover:text-white">Cupones canjeados</Link>.
          </p>
          <button type="button" onClick={() => setCanje(null)} className="mt-5 text-sm text-white/60 underline underline-offset-4 hover:text-white">
            Cerrar
          </button>
        </div>
      )}

      {error && <p role="alert" className="mb-6 rounded-md bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}

      {beneficios.length === 0 ? (
        <p className="text-white/70">Por ahora no hay beneficios disponibles. Volvé pronto.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-3">
          {beneficios.map((b, i) => {
            const faltan = puntos == null ? null : Math.max(0, b.costo_puntos - puntos);
            const enConfirmacion = confirmando === b.id;
            return (
              <li key={b.id}>
                <Reveal className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-7 md:p-9" delay={i * 120}>
                  <p className="font-display text-7xl leading-none">{b.descuento}%</p>
                  <h2 className="mt-5 font-display text-2xl">{b.nombre}</h2>
                  {b.descripcion && <p className="mt-3 flex-1 text-white/70">{b.descripcion}</p>}

                  <p className={`${etiqueta} mt-6`}>Costo</p>
                  <p className="mt-2 text-xl">{b.costo_puntos.toLocaleString('es-AR')} puntos</p>

                  <div className="mt-6">
                    {puntos == null ? (
                      <Link href="/login" className={`${botonPrincipal} block text-center`}>Ingresá para canjear</Link>
                    ) : faltan > 0 ? (
                      <button type="button" disabled className={`${botonBase} border-white/30 text-white`}>
                        Te faltan {faltan.toLocaleString('es-AR')} puntos
                      </button>
                    ) : enConfirmacion ? (
                      <div>
                        <p className="mb-3 text-center text-sm text-white/80">
                          Se descuentan {b.costo_puntos.toLocaleString('es-AR')} puntos de tu cuenta.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => setConfirmando(null)} disabled={canjeando === b.id} className={`${botonBase} border-white/30 text-white/80 hover:border-white`}>
                            Cancelar
                          </button>
                          <button type="button" onClick={() => canjear(b.id)} disabled={canjeando === b.id} className={botonPrincipal}>
                            {canjeando === b.id ? 'Canjeando…' : 'Confirmar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setError(''); setConfirmando(b.id); }} className={botonPrincipal}>
                        Canjear
                      </button>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
