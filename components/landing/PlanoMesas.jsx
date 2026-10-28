'use client';

// Plano del salón. Dibuja las mesas que existen en la base de datos (no hay posiciones fijas):
// se acomodan solas en una grilla y la forma depende de la capacidad.
const CELDA_W = 110;
const CELDA_H = 104;
const MAX_COLS = 4;
const PAD = 14;
const TOP = 28; // franja del ventanal
const BOTTOM = 34; // franja de la entrada

function geometria(capacidad, cx, cy) {
  const n = Math.max(1, Math.min(capacidad, 12));

  // 1 o 2 personas: mesa redonda
  if (n <= 2) {
    const r = 20;
    const inicio = n === 2 ? 0 : -Math.PI / 2;
    const sillas = Array.from({ length: n }, (_, i) => {
      const a = inicio + (i * 2 * Math.PI) / n;
      return { x: cx + Math.cos(a) * (r + 10), y: cy + Math.sin(a) * (r + 10) };
    });
    return { forma: 'redonda', r, sillas };
  }

  // 3 o más: mesa rectangular con sillas arriba y abajo
  const arriba = Math.ceil(n / 2);
  const abajo = n - arriba;
  const w = Math.min(CELDA_W - 14, Math.max(44, arriba * 22));
  const h = 36;
  const fila = (cant, y) =>
    Array.from({ length: cant }, (_, j) => ({ x: cx - w / 2 + ((j + 0.5) * w) / cant, y }));
  return { forma: 'rect', w, h, sillas: [...fila(arriba, cy - h / 2 - 9), ...fila(abajo, cy + h / 2 + 9)] };
}

const ESTILO = {
  libre: {
    cuerpo: 'fill-white stroke-tinta group-hover:fill-sifon',
    silla: 'fill-sifon stroke-tinta',
    numero: 'fill-tinta',
    texto: 'fill-tinta/70',
  },
  elegida: {
    cuerpo: 'fill-tomate stroke-tomate',
    silla: 'fill-tomate stroke-tomate',
    numero: 'fill-white',
    texto: 'fill-tomate',
  },
  ocupada: {
    cuerpo: 'fill-tinta/15 stroke-tinta/30',
    silla: 'fill-tinta/10 stroke-tinta/25',
    numero: 'fill-tinta/40',
    texto: 'fill-tinta/50',
  },
  chica: {
    cuerpo: 'fill-white stroke-tinta/30 [stroke-dasharray:4_3]',
    silla: 'fill-white stroke-tinta/25',
    numero: 'fill-tinta/40',
    texto: 'fill-tinta/50',
  },
};

const CAPTION = { libre: (m) => `Para ${m.capacidad}`, elegida: () => 'Tu mesa', ocupada: () => 'Ocupada', chica: () => 'No entra' };
const DESCRIPCION = { libre: 'libre', elegida: 'elegida', ocupada: 'ocupada en ese horario', chica: 'muy chica para tu grupo' };

export default function PlanoMesas({ mesas, personas, seleccionada, onSelect }) {
  const cols = Math.min(MAX_COLS, Math.max(1, mesas.length));
  const filas = Math.ceil(mesas.length / cols);
  const ancho = cols * CELDA_W + PAD * 2;
  const alto = PAD + TOP + filas * CELDA_H + BOTTOM + PAD;
  const centro = ancho / 2;

  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full" role="group" aria-label="Plano del salón">
        {/* Salón */}
        <rect x="3" y="3" width={ancho - 6} height={alto - 6} rx="10" className="fill-papel" />
        <path
          d={`M ${centro + 30} ${alto - 3} H ${ancho - 3} V 3 H 3 V ${alto - 3} H ${centro - 30}`}
          fill="none"
          strokeWidth="3"
          strokeLinejoin="round"
          className="stroke-tinta"
        />
        {/* Ventanal */}
        <rect x={ancho * 0.2} y="1" width={ancho * 0.6} height="5" rx="2" strokeWidth="1.5" className="fill-sifon stroke-tinta" />
        <text x={centro} y={PAD + 16} textAnchor="middle" fontSize="10" className="fill-tinta/50">
          Ventanal
        </text>
        {/* Entrada */}
        <text x={centro} y={alto - 12} textAnchor="middle" fontSize="10" className="fill-tinta/50">
          Entrada
        </text>

        {mesas.map((m, i) => {
          const col = i % cols;
          const fila = Math.floor(i / cols);
          const enFila = fila === filas - 1 ? mesas.length - fila * cols : cols;
          const desplazamiento = ((cols - enFila) * CELDA_W) / 2; // centra la última fila
          const cx = PAD + desplazamiento + col * CELDA_W + CELDA_W / 2;
          const arriba = PAD + TOP + fila * CELDA_H;
          const cy = arriba + 46;

          const sel = seleccionada === m.id;
          const estado = sel ? 'elegida' : !m.libre ? 'ocupada' : m.capacidad < personas ? 'chica' : 'libre';
          const activa = estado === 'libre' || estado === 'elegida';
          const e = ESTILO[estado];
          const g = geometria(m.capacidad, cx, cy);
          const alternar = () => activa && onSelect(sel ? '' : m.id);

          return (
            <g
              key={m.id}
              role="button"
              tabIndex={activa ? 0 : -1}
              aria-pressed={sel}
              aria-disabled={!activa}
              aria-label={`Mesa ${m.numero_mesa}, para ${m.capacidad} personas, ${DESCRIPCION[estado]}`}
              onClick={alternar}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  alternar();
                }
              }}
              className={`group ${activa ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <title>{`Mesa ${m.numero_mesa} · para ${m.capacidad} · ${DESCRIPCION[estado]}`}</title>
              {/* Zona de click amplia */}
              <rect x={cx - CELDA_W / 2 + 4} y={arriba} width={CELDA_W - 8} height={CELDA_H - 4} fill="transparent" />

              {g.sillas.map((s, k) => (
                <circle key={k} cx={s.x} cy={s.y} r="5.5" strokeWidth="1.2" className={e.silla} />
              ))}
              {g.forma === 'redonda' ? (
                <circle cx={cx} cy={cy} r={g.r} strokeWidth="2" className={e.cuerpo} />
              ) : (
                <rect x={cx - g.w / 2} y={cy - g.h / 2} width={g.w} height={g.h} rx="8" strokeWidth="2" className={e.cuerpo} />
              )}

              <text x={cx} y={cy} dy=".35em" textAnchor="middle" fontSize="17" className={`font-display ${e.numero}`}>
                {m.numero_mesa}
              </text>
              <text x={cx} y={arriba + 96} textAnchor="middle" fontSize="11" fontWeight="600" className={e.texto}>
                {CAPTION[estado](m)}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta/70">
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-tinta bg-white align-[-2px]" />Libre</li>
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-tomate bg-tomate align-[-2px]" />Elegida</li>
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-tinta/30 bg-tinta/15 align-[-2px]" />Ocupada</li>
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-dashed border-tinta/30 bg-white align-[-2px]" />No entra tu grupo</li>
      </ul>
    </div>
  );
}
