'use client';

import { useState } from 'react';
import { sumarDias } from '@/lib/utils';

const DIAS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Calendario mensual (semana desde el lunes). Deshabilita días pasados, muy lejanos y los días de cierre.
export default function CalendarioReserva({ fecha, onSelect, hoy, maxDias = 90, diasCerrados = [] }) {
  const [vista, setVista] = useState(() => {
    const [y, m] = (fecha || hoy).split('-').map(Number);
    return { y, m: m - 1 };
  });

  const [hy, hm] = hoy.split('-').map(Number);
  const limite = sumarDias(hoy, maxDias);
  const [ly, lm] = limite.split('-').map(Number);
  const enMesActual = vista.y === hy && vista.m === hm - 1;
  const enMesLimite = vista.y === ly && vista.m === lm - 1;

  const primero = new Date(Date.UTC(vista.y, vista.m, 1));
  const desfase = (primero.getUTCDay() + 6) % 7; // lunes = 0
  const cantDias = new Date(Date.UTC(vista.y, vista.m + 1, 0)).getUTCDate();
  const celdas = [...Array(desfase).fill(null), ...Array.from({ length: cantDias }, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const titulo = primero.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  function mover(delta) {
    setVista(({ y, m }) => {
      const d = new Date(Date.UTC(y, m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  }

  const flecha = 'flex h-9 w-9 items-center justify-center rounded-full text-tinta transition-colors hover:bg-tinta/10 disabled:cursor-not-allowed disabled:text-tinta/25 disabled:hover:bg-transparent';

  return (
    <div>
      <div className="flex items-center justify-between bg-tinta/[0.06] px-3 py-3">
        <button type="button" onClick={() => mover(-1)} disabled={enMesActual} aria-label="Mes anterior" className={flecha}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <p className="text-base font-medium capitalize" aria-live="polite">{titulo}</p>
        <button type="button" onClick={() => mover(1)} disabled={enMesLimite} aria-label="Mes siguiente" className={flecha}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 bg-tinta/[0.06] pb-2 text-center text-[10px] font-semibold tracking-[0.15em] text-tinta/70">
        {DIAS.map((d) => (
          <span key={d} className="py-2">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px border border-tinta/10 bg-tinta/10">
        {celdas.map((dia, i) => {
          if (dia === null) return <span key={`v${i}`} className="h-11 bg-tinta/[0.04] sm:h-12" />;

          const s = iso(vista.y, vista.m, dia);
          const diaSemana = new Date(Date.UTC(vista.y, vista.m, dia)).getUTCDay();
          const cerrado = diasCerrados.includes(diaSemana);
          const deshabilitado = s < hoy || s > limite || cerrado;
          const elegido = s === fecha;
          const esHoy = s === hoy;

          return (
            <button
              key={s}
              type="button"
              disabled={deshabilitado}
              onClick={() => onSelect(s)}
              aria-pressed={elegido}
              aria-current={esHoy ? 'date' : undefined}
              aria-label={`${dia} de ${primero.toLocaleDateString('es-AR', { month: 'long', timeZone: 'UTC' })}${cerrado ? ', cerrado' : ''}`}
              title={cerrado ? 'Cerrado' : undefined}
              className={`relative flex h-11 flex-col items-center justify-center text-sm transition-colors sm:h-12 ${
                elegido
                  ? 'bg-tinta font-semibold text-white'
                  : deshabilitado
                    ? 'cursor-not-allowed bg-white text-tinta/25'
                    : 'bg-white text-tinta hover:bg-sifon/60'
              }`}
            >
              {dia}
              {esHoy && <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${elegido ? 'bg-white' : 'bg-tomate'}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
