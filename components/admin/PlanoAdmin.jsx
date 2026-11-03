'use client';

import { useRef, useState } from 'react';

// Plano del salón para el panel del local. Mismo estilo minimalista que ve el cliente, pero cada mesa muestra
// su estado real y, si tiene reservas hoy, un número al costado con la cantidad.
// En modo edición las mesas se arrastran: soltar una sobre otra intercambia sus lugares.
const CELDA_W = 110;
const CELDA_H = 112;
const MAX_COLS = 4;
const PAD = 14;
const TOP = 28; // franja del ventanal
const BOTTOM = 34; // franja de la entrada

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

// Posición de cada lugar (slot) del plano
function armarLayout(n) {
  const cols = Math.min(MAX_COLS, Math.max(1, n));
  const filas = Math.ceil(n / cols);
  const ancho = cols * CELDA_W + PAD * 2;
  const alto = PAD + TOP + filas * CELDA_H + BOTTOM + PAD;
  const slot = (i) => {
    const col = i % cols;
    const fila = Math.floor(i / cols);
    const enFila = fila === filas - 1 ? n - fila * cols : cols;
    const desplazamiento = ((cols - enFila) * CELDA_W) / 2; // centra la última fila
    const arriba = PAD + TOP + fila * CELDA_H;
    return { cx: PAD + desplazamiento + col * CELDA_W + CELDA_W / 2, cy: arriba + 56, arriba };
  };
  return { cols, filas, ancho, alto, centro: ancho / 2, slot };
}

// Diseño minimalista: solo grises y un toque de ocre para "reservada".
//   libre     -> blanca, borde fino
//   reservada -> crema con la hora de la reserva
//   ocupada   -> negra ("en uso")
//   inactiva  -> rayada con borde punteado
const ESTILO = {
  libre: {
    cuerpo: 'fill-white stroke-tinta/15 group-hover:stroke-tinta/40',
    silla: 'fill-tinta/15',
    numero: 'fill-tinta',
    texto: 'fill-tinta/45',
  },
  reservada: {
    cuerpo: 'fill-limon/35 stroke-limon group-hover:fill-limon/50',
    silla: 'fill-limon',
    numero: 'fill-tinta',
    texto: 'fill-tinta',
  },
  ocupada: {
    cuerpo: 'fill-tinta stroke-tinta',
    silla: 'fill-tinta/70',
    numero: 'fill-white',
    texto: 'fill-tinta',
  },
  inactiva: {
    cuerpo: 'fill-transparent stroke-tinta/30 [stroke-dasharray:4_3]',
    silla: 'fill-transparent stroke-tinta/25 [stroke-dasharray:2_2]',
    numero: 'fill-tinta/30',
    texto: 'fill-tinta/40',
  },
};

const SOMBRA_SUAVE = { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.12))' };
const SOMBRA_MARCO = { filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.12))' };

const ETIQUETA = { libre: 'libre', reservada: 'reservada', ocupada: 'ocupada', inactiva: 'inactiva' };

const intercambiar = (lista, a, b) => {
  const copia = [...lista];
  [copia[a], copia[b]] = [copia[b], copia[a]];
  return copia;
};

export default function PlanoAdmin({ mesas, seleccionada, onSelect, editando = false, onReorder }) {
  const svgRef = useRef(null);
  // drag: { id, desde, ox, oy, px, py, sobre } mientras se arrastra una mesa
  const [drag, setDrag] = useState(null);
  const L = armarLayout(mesas.length);

  // Coordenadas del puntero dentro del dibujo (el SVG se escala, así que hay que convertir)
  function aSvg(ev) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function lugarMasCercano(x, y) {
    let mejor = -1;
    let dMin = Infinity;
    for (let i = 0; i < mesas.length; i++) {
      const s = L.slot(i);
      const d = Math.hypot(x - s.cx, y - s.cy);
      if (d < dMin) {
        dMin = d;
        mejor = i;
      }
    }
    return dMin <= CELDA_W ? mejor : -1;
  }

  function iniciarArrastre(ev, m, indice) {
    if (!editando || ev.button > 0) return;
    ev.preventDefault();
    svgRef.current.setPointerCapture(ev.pointerId);
    const p = aSvg(ev);
    const s = L.slot(indice);
    setDrag({ id: m.id, desde: indice, ox: s.cx - p.x, oy: s.cy - p.y, px: p.x, py: p.y, sobre: indice });
  }

  function arrastrar(ev) {
    if (!drag) return;
    const p = aSvg(ev);
    const lugar = lugarMasCercano(p.x + drag.ox, p.y + drag.oy);
    setDrag({ ...drag, px: p.x, py: p.y, sobre: lugar === -1 ? drag.desde : lugar });
  }

  function soltar(ev) {
    if (!drag) return;
    if (svgRef.current.hasPointerCapture?.(ev.pointerId)) svgRef.current.releasePointerCapture(ev.pointerId);
    if (drag.sobre !== drag.desde) onReorder?.(intercambiar(mesas, drag.desde, drag.sobre));
    setDrag(null);
  }

  // Mientras se arrastra, la mesa de destino se muestra ya en el lugar de origen (vista previa del intercambio)
  const vista = drag && drag.sobre !== drag.desde ? intercambiar(mesas, drag.desde, drag.sobre) : mesas;
  const arrastrada = drag ? mesas[drag.desde] : null;

  const dibujar = (m, lugar, enMovimiento = false) => {
    const { cx, cy, arriba } = L.slot(lugar);
    const posicionLista = mesas.findIndex((x) => x.id === m.id);
    const sel = !editando && seleccionada === m.id;
    const e = ESTILO[m.vista];
    const g = geometria(m.capacidad, cx, cy);
    const cant = m.hoy.length;
    const alternar = () => !editando && onSelect(sel ? null : m.id);
    const textoPie =
      m.vista === 'libre' ? `${m.capacidad} ${m.capacidad === 1 ? 'lugar' : 'lugares'}` : m.vista === 'ocupada' ? 'En uso' : 'Inactiva';

    // Forma de la mesa (la misma para el cuerpo y para el rayado de las inactivas)
    const forma = (props) =>
      g.forma === 'redonda' ? (
        <circle cx={cx} cy={cy} r={g.r} {...props} />
      ) : (
        <rect x={cx - g.w / 2} y={cy - g.h / 2} width={g.w} height={g.h} rx="9" {...props} />
      );

    // Posición del globito con la cantidad de reservas de hoy: esquina superior derecha de la mesa
    const bx = Math.min(cx + (g.forma === 'redonda' ? g.r + 6 : g.w / 2 + 6), cx + 44);
    const by = g.forma === 'redonda' ? cy - g.r - 3 : cy - g.h / 2 - 20;

    return (
      <g
        key={m.id}
        transform={enMovimiento ? `translate(${drag.px + drag.ox - cx} ${drag.py + drag.oy - cy})` : undefined}
        style={enMovimiento ? { filter: 'drop-shadow(0 8px 8px rgba(0,0,0,.25))' } : undefined}
        role="button"
        tabIndex={0}
        aria-pressed={editando ? undefined : sel}
        aria-label={
          editando
            ? `Mesa ${m.numero_mesa}, lugar ${posicionLista + 1} de ${mesas.length}. Usá las flechas del teclado para moverla.`
            : `Mesa ${m.numero_mesa}, para ${m.capacidad} personas, ${ETIQUETA[m.vista]}${m.vista === 'reservada' && m.horaReserva ? ` a las ${m.horaReserva}` : ''}${cant ? `, ${cant} ${cant === 1 ? 'reserva' : 'reservas'} hoy` : ''
            }`
        }
        onClick={alternar}
        onPointerDown={(ev) => iniciarArrastre(ev, m, posicionLista)}
        onKeyDown={(ev) => {
          if (editando) {
            const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -L.cols, ArrowDown: L.cols }[ev.key];
            if (delta === undefined) return;
            ev.preventDefault();
            const destino = posicionLista + delta;
            if (destino >= 0 && destino < mesas.length) onReorder?.(intercambiar(mesas, posicionLista, destino));
            return;
          }
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            alternar();
          }
        }}
        className={`group ${editando ? (enMovimiento ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'}`}
      >
        <title>{`Mesa ${m.numero_mesa} · para ${m.capacidad} · ${ETIQUETA[m.vista]}`}</title>

        {/* Marco de la mesa seleccionada (también es la zona de click) */}
        <rect
          x={cx - CELDA_W / 2 + 3}
          y={arriba}
          width={CELDA_W - 6}
          height={CELDA_H - 4}
          rx="14"
          strokeWidth="2"
          style={sel ? SOMBRA_MARCO : undefined}
          className={sel ? 'fill-white stroke-tinta' : 'fill-transparent stroke-transparent'}
        />

        {g.sillas.map((s, k) => (
          <rect key={k} x={s.x - s.w / 2} y={s.y - s.h / 2} width={s.w} height={s.h} rx={Math.min(s.w, s.h) / 2} strokeWidth="1" className={e.silla} />
        ))}

        {forma({ strokeWidth: m.vista === 'inactiva' ? 1.5 : 1.25, className: `transition-colors ${e.cuerpo}`, style: m.vista === 'libre' || m.vista === 'reservada' ? SOMBRA_SUAVE : undefined })}
        {m.vista === 'inactiva' && forma({ fill: 'url(#plano-admin-rayas)', pointerEvents: 'none' })}

        <text x={cx} y={cy} dy=".35em" textAnchor="middle" fontSize="19" className={`font-display ${e.numero}`}>
          {m.numero_mesa}
        </text>

        {/* Pie: hora de la reserva, o el estado / capacidad */}
        {m.vista === 'reservada' && m.horaReserva ? (
          <g>
            <rect x={cx - 25} y={arriba + 88} width="50" height="16" rx="8" className="fill-tinta" />
            <circle cx={cx - 15} cy={arriba + 96} r="4.2" fill="none" strokeWidth="1.3" className="stroke-white" />
            <path d={`M ${cx - 15} ${arriba + 93.8} V ${arriba + 96} L ${cx - 13.2} ${arriba + 97.2}`} fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="stroke-white" />
            <text x={cx - 8} y={arriba + 96} dy=".35em" fontSize="10.5" fontWeight="600" className="fill-white">
              {m.horaReserva}
            </text>
          </g>
        ) : (
          <text x={cx} y={arriba + 99} textAnchor="middle" fontSize="11" fontWeight={m.vista === 'ocupada' ? 700 : 500} className={e.texto}>
            {textoPie}
          </text>
        )}

        {/* Cantidad de reservas de hoy, en la esquina de la mesa */}
        {cant > 0 && !editando && (
          <g>
            <title>{`${cant} ${cant === 1 ? 'reserva' : 'reservas'} para hoy`}</title>
            <circle cx={bx} cy={by} r="9" strokeWidth="2" className="fill-tinta stroke-white" />
            <text x={bx} y={by} dy=".35em" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-white">
              {cant}
            </text>
          </g>
        )}
      </g>
    );
  };

  const { ancho, alto, centro } = L;
  const reservasHoy = mesas.reduce((t, m) => t + m.hoy.length, 0);
  const contar = (v) => mesas.filter((m) => m.vista === v).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Resumen: cuántas mesas hay en cada estado */}
      <ul className="mb-3 flex shrink-0 flex-wrap gap-1.5 text-xs text-tinta/70">
        <li className="flex items-center gap-2 rounded-full border border-tinta/10 bg-white px-3 py-1">
          <span className="h-3 w-3 rounded-full border border-tinta/30 bg-white" />
          Libres <strong className="tabular-nums text-tinta">{contar('libre')}</strong>
        </li>
        <li className="flex items-center gap-2 rounded-full border border-tinta/10 bg-white px-3 py-1">
          <span className="h-3 w-3 rounded-full border border-limon bg-limon/50" />
          Reservadas <strong className="tabular-nums text-tinta">{contar('reservada')}</strong>
        </li>
        <li className="flex items-center gap-2 rounded-full border border-tinta/10 bg-white px-3 py-1">
          <span className="h-3 w-3 rounded-full bg-tinta" />
          Ocupadas <strong className="tabular-nums text-tinta">{contar('ocupada')}</strong>
        </li>
        <li className="flex items-center gap-2 rounded-full border border-tinta/10 bg-white px-3 py-1">
          <span className="h-3 w-3 rounded-full border border-dashed border-tinta/40" />
          Inactivas <strong className="tabular-nums text-tinta">{contar('inactiva')}</strong>
        </li>
        <li className="flex items-center gap-2 rounded-full border border-tinta/10 bg-white px-3 py-1">
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tinta px-1 text-[10px] font-bold leading-none text-white">
            {reservasHoy}
          </span>
          Reservas de hoy
        </li>
      </ul>

      {/* En pantallas medianas y grandes el plano ocupa todo el alto libre y se escala para que entre */}
      <div className="md:relative md:min-h-0 md:flex-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${ancho} ${alto}`}
          className="h-auto w-full select-none md:absolute md:inset-0 md:h-full"
          style={editando ? { touchAction: 'none' } : undefined}
          role="group"
          aria-label={editando ? 'Plano del salón en modo edición' : 'Plano del salón'}
          onPointerMove={arrastrar}
          onPointerUp={soltar}
          onPointerCancel={() => setDrag(null)}
        >
          <defs>
            <pattern id="plano-admin-puntos" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="0.7" className="fill-tinta/15" />
            </pattern>
            <pattern id="plano-admin-rayas" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" strokeWidth="1.2" className="stroke-tinta/15" />
            </pattern>
          </defs>

          {/* Salón: fondo con puntitos y borde fino */}
          <rect x="1" y="1" width={ancho - 2} height={alto - 2} rx="14" className="fill-papel" />
          <rect x="1" y="1" width={ancho - 2} height={alto - 2} rx="14" fill="url(#plano-admin-puntos)" />
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

          {/* Lugares: en modo edición se ven como casilleros; el de destino se resalta */}
          {editando &&
            mesas.map((_, i) => {
              const s = L.slot(i);
              const destino = drag && drag.sobre === i && drag.sobre !== drag.desde;
              return (
                <rect
                  key={`lugar-${i}`}
                  x={s.cx - CELDA_W / 2 + 3}
                  y={s.arriba}
                  width={CELDA_W - 6}
                  height={CELDA_H - 4}
                  rx="14"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  className={destino ? 'fill-tinta/10 stroke-tinta' : 'fill-tinta/[.03] stroke-tinta/20'}
                />
              );
            })}

          {vista.map((m, i) => (arrastrada && m.id === arrastrada.id ? null : dibujar(m, i)))}
          {/* La mesa que se arrastra se dibuja al final para que quede por encima */}
          {arrastrada && dibujar(arrastrada, drag.desde, true)}
        </svg>
      </div>
    </div>
  );
}