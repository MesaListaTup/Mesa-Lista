'use client';

// Plano del salón (versión cliente, minimalista). Dibuja las mesas que existen en la base de datos (no hay posiciones fijas):
// se acomodan solas en una grilla y la forma depende de la capacidad.
const CELDA_W = 110;
const CELDA_H = 104;
const MAX_COLS = 4;
const PAD = 14;
const TOP = 28; // franja del ventanal
const BOTTOM = 34; // franja de la entrada

// Capacidad máxima de mesa que se le ofrece a un grupo: se redondea al siguiente número par
// (1-2 personas -> mesa de 2, 3-4 -> mesa de 4, 5-6 -> mesa de 6...). Así 2 personas no ocupan una mesa de 10.
// Tiene que coincidir con capacidad_maxima_mesa() de supabase/v7_reservas_reglas.sql.
export function capacidadMaxima(personas) {
  return personas + (personas % 2);
}

function geometria(capacidad, cx, cy) {
  const n = Math.max(1, Math.min(capacidad, 12));

  // 1 o 2 personas: mesa redonda con las sillas a los costados
  if (n <= 2) {
    const r = 20;
    const lado = r + 9;
    const sillas = [{ x: cx - lado, y: cy, w: 6, h: 14 }];
    if (n === 2) sillas.push({ x: cx + lado, y: cy, w: 6, h: 14 });
    return { forma: 'redonda', r, sillas };
  }

  // 3 o más: mesa rectangular con sillas arriba y abajo
  const arriba = Math.ceil(n / 2);
  const abajo = n - arriba;
  const w = Math.min(CELDA_W - 14, Math.max(44, arriba * 22));
  const h = 36;
  const ancho = Math.max(8, Math.min(14, w / arriba - 6));
  const fila = (cant, y) =>
    Array.from({ length: cant }, (_, j) => ({ x: cx - w / 2 + ((j + 0.5) * w) / cant, y, w: ancho, h: 6 }));
  return { forma: 'rect', w, h, sillas: [...fila(arriba, cy - h / 2 - 8), ...fila(abajo, cy + h / 2 + 8)] };
}

// Diseño minimalista: blanca = libre, negra = tu mesa, gris liso = ocupada, punteada = no corresponde a tu grupo.
const ESTILO = {
  libre: {
    cuerpo: 'fill-white stroke-tinta/15 group-hover:stroke-tinta/50',
    silla: 'fill-tinta/15 group-hover:fill-tinta/30',
    numero: 'fill-tinta',
    texto: 'fill-tinta/45',
  },
  elegida: {
    cuerpo: 'fill-tinta stroke-tinta',
    silla: 'fill-tinta/70',
    numero: 'fill-white',
    texto: 'fill-tinta',
  },
  // Mesa que no corresponde al grupo (muy chica o desproporcionadamente grande): se ve en el plano pero no se puede elegir
  noApta: {
    cuerpo: 'fill-transparent stroke-tinta/25 [stroke-dasharray:4_3]',
    silla: 'fill-transparent stroke-tinta/20 [stroke-dasharray:2_2]',
    numero: 'fill-tinta/30',
    texto: 'fill-tinta/40',
  },
  ocupada: {
    cuerpo: 'fill-tinta/10 stroke-tinta/10',
    silla: 'fill-tinta/10',
    numero: 'fill-tinta/35',
    texto: 'fill-tinta/40',
  },
};

const SOMBRA_SUAVE = { filter: 'drop-shadow(0 1px 2px rgba(28,29,33,.12))' };
const SOMBRA_MARCO = { filter: 'drop-shadow(0 4px 10px rgba(28,29,33,.14))' };

const CAPTION = { libre: (m) => `${m.capacidad} ${m.capacidad === 1 ? 'lugar' : 'lugares'}`, elegida: () => 'Tu mesa', ocupada: () => 'Ocupada', chica: () => 'No entra', grande: () => 'Muy grande' };
const DESCRIPCION = { libre: 'libre', elegida: 'elegida', ocupada: 'ocupada en ese horario', chica: 'muy chica para tu grupo', grande: 'demasiado grande para tu grupo' };

export default function PlanoMesas({ mesas, personas, seleccionada, onSelect }) {
  const cols = Math.min(MAX_COLS, Math.max(1, mesas.length));
  const filas = Math.ceil(mesas.length / cols);
  const ancho = cols * CELDA_W + PAD * 2;
  const alto = PAD + TOP + filas * CELDA_H + BOTTOM + PAD;
  const centro = ancho / 2;

  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="h-auto w-full" role="group" aria-label="Plano del salón">
        <defs>
          <pattern id="plano-cliente-puntos" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="0.7" className="fill-tinta/15" />
          </pattern>
        </defs>

        {/* Salón: fondo con puntitos y borde fino */}
        <rect x="1" y="1" width={ancho - 2} height={alto - 2} rx="14" className="fill-papel" />
        <rect x="1" y="1" width={ancho - 2} height={alto - 2} rx="14" fill="url(#plano-cliente-puntos)" />
        <rect x="1" y="1" width={ancho - 2} height={alto - 2} rx="14" fill="none" strokeWidth="1" className="stroke-tinta/10" />

        {/* Ventanal */}
        <rect x={ancho * 0.22} y="1" width={ancho * 0.56} height="4" rx="2" className="fill-tinta/25" />
        <text x={centro + 1.5} y={PAD + 14} textAnchor="middle" fontSize="8.5" fontWeight="500" letterSpacing="3" className="fill-tinta/40">
          VENTANAL
        </text>
        {/* Entrada */}
        <text x={centro + 1.5} y={alto - 16} textAnchor="middle" fontSize="8.5" fontWeight="500" letterSpacing="3" className="fill-tinta/40">
          ENTRADA
        </text>
        <rect x={centro - 30} y={alto - 5} width="60" height="4" rx="2" className="fill-tinta/25" />

        {mesas.map((m, i) => {
          const col = i % cols;
          const fila = Math.floor(i / cols);
          const enFila = fila === filas - 1 ? mesas.length - fila * cols : cols;
          const desplazamiento = ((cols - enFila) * CELDA_W) / 2; // centra la última fila
          const cx = PAD + desplazamiento + col * CELDA_W + CELDA_W / 2;
          const arriba = PAD + TOP + fila * CELDA_H;
          const cy = arriba + 46;

          const sel = seleccionada === m.id;
          const estado = sel
            ? 'elegida'
            : m.capacidad < personas
              ? 'chica'
              : m.capacidad > capacidadMaxima(personas)
                ? 'grande'
                : !m.libre
                  ? 'ocupada'
                  : 'libre';
          const activa = estado === 'libre' || estado === 'elegida';
          const e = ESTILO[estado === 'chica' || estado === 'grande' ? 'noApta' : estado];
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

              {/* Marco de la mesa elegida (también es la zona de click) */}
              <rect
                x={cx - CELDA_W / 2 + 4}
                y={arriba}
                width={CELDA_W - 8}
                height={CELDA_H - 4}
                rx="14"
                strokeWidth="2"
                style={sel ? SOMBRA_MARCO : undefined}
                className={sel ? 'fill-white stroke-tinta' : 'fill-transparent stroke-transparent'}
              />

              {g.sillas.map((s, k) => (
                <rect key={k} x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={Math.min(s.w, s.h) / 2} strokeWidth="1" className={`transition-colors ${e.silla}`} />
              ))}
              {g.forma === 'redonda' ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={g.r}
                  strokeWidth="1.25"
                  style={estado === 'libre' ? SOMBRA_SUAVE : undefined}
                  className={`transition-colors ${e.cuerpo}`}
                />
              ) : (
                <rect
                  x={cx - g.w / 2}
                  y={cy - g.h / 2}
                  width={g.w}
                  height={g.h}
                  rx="9"
                  strokeWidth="1.25"
                  style={estado === 'libre' ? SOMBRA_SUAVE : undefined}
                  className={`transition-colors ${e.cuerpo}`}
                />
              )}

              <text x={cx} y={cy} dy=".35em" textAnchor="middle" fontSize="19" className={`font-display ${e.numero}`}>
                {m.numero_mesa}
              </text>
              <text x={cx} y={arriba + 94} textAnchor="middle" fontSize="11" fontWeight={estado === 'elegida' ? 700 : 500} className={e.texto}>
                {CAPTION[estado](m)}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-tinta/70">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-tinta/30 bg-white" />Libre</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-tinta" />Tu mesa</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-tinta/10 bg-tinta/10" />Ocupada</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-dashed border-tinta/40" />No corresponde a tu grupo</li>
      </ul>
    </div>
  );
}