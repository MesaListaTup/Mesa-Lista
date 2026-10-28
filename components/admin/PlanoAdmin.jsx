'use client';

import { useRef, useState } from 'react';

// Plano del salón para el panel del local. Mismo dibujo que ve el cliente, pero cada mesa muestra
// su estado real y, si tiene reservas hoy, un número encima con la cantidad.
// En modo edición las mesas se arrastran: soltar una sobre otra intercambia sus lugares.
const CELDA_W = 110;
const CELDA_H = 112;
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

const ESTILO = {
  libre: {
    cuerpo: 'fill-white stroke-tinta group-hover:fill-sifon',
    silla: 'fill-sifon stroke-tinta',
    numero: 'fill-tinta',
    texto: 'fill-tinta/70',
  },
  reservada: {
    cuerpo: 'fill-limon/60 stroke-tinta group-hover:fill-limon',
    silla: 'fill-limon/60 stroke-tinta',
    numero: 'fill-tinta',
    texto: 'fill-tinta',
  },
  ocupada: {
    cuerpo: 'fill-tomate/20 stroke-tomate group-hover:fill-tomate/30',
    silla: 'fill-tomate/20 stroke-tomate',
    numero: 'fill-tomate',
    texto: 'fill-tomate',
  },
  inactiva: {
    cuerpo: 'fill-tinta/10 stroke-tinta/30 [stroke-dasharray:4_3]',
    silla: 'fill-tinta/5 stroke-tinta/25',
    numero: 'fill-tinta/40',
    texto: 'fill-tinta/50',
  },
};

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
    const caption =
      m.vista === 'reservada' ? `Reserva ${m.horaReserva}` : m.vista === 'libre' ? 'Libre' : m.vista === 'ocupada' ? 'Ocupada' : 'Inactiva';
    const alternar = () => !editando && onSelect(sel ? null : m.id);

    return (
      <g
        key={m.id}
        transform={enMovimiento ? `translate(${drag.px + drag.ox - cx} ${drag.py + drag.oy - cy})` : undefined}
        style={enMovimiento ? { filter: 'drop-shadow(0 6px 6px rgba(21,35,59,.35))' } : undefined}
        role="button"
        tabIndex={0}
        aria-pressed={editando ? undefined : sel}
        aria-label={
          editando
            ? `Mesa ${m.numero_mesa}, lugar ${posicionLista + 1} de ${mesas.length}. Usá las flechas del teclado para moverla.`
            : `Mesa ${m.numero_mesa}, para ${m.capacidad} personas, ${ETIQUETA[m.vista]}${cant ? `, ${cant} ${cant === 1 ? 'reserva' : 'reservas'} hoy` : ''
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

        {/* Marco suave de la mesa seleccionada (también es la zona de click) */}
        <rect
          x={cx - CELDA_W / 2 + 3}
          y={arriba}
          width={CELDA_W - 6}
          height={CELDA_H - 4}
          rx="12"
          strokeWidth="1.5"
          className={sel ? 'fill-tinta/5 stroke-tinta/50' : 'fill-transparent stroke-transparent'}
        />

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
        <text x={cx} y={arriba + 104} textAnchor="middle" fontSize="11" fontWeight="600" className={e.texto}>
          {caption}
        </text>

        {/* Cantidad de reservas de hoy, por encima de la mesa */}
        {cant > 0 && !editando && (
          <g>
            <title>{`${cant} ${cant === 1 ? 'reserva' : 'reservas'} para hoy`}</title>
            <circle cx={cx} cy={arriba + 11} r="9" strokeWidth="1.5" className="fill-tinta stroke-white" />
            <text x={cx} y={arriba + 11} dy=".35em" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-white">
              {cant}
            </text>
          </g>
        )}
      </g>
    );
  };

  const { ancho, alto, centro } = L;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
                  rx="12"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  className={destino ? 'fill-sifon/60 stroke-tinta' : 'fill-tinta/5 stroke-tinta/30'}
                />
              );
            })}

          {vista.map((m, i) => (arrastrada && m.id === arrastrada.id ? null : dibujar(m, i)))}
          {/* La mesa que se arrastra se dibuja al final para que quede por encima */}
          {arrastrada && dibujar(arrastrada, drag.desde, true)}
        </svg>
      </div>

      <ul className="mt-2 flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-xs text-tinta/70">
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-tinta bg-white align-[-2px]" />Libre</li>
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-tinta bg-limon/60 align-[-2px]" />Reservada</li>
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-tomate bg-tomate/20 align-[-2px]" />Ocupada</li>
        <li><span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-dashed border-tinta/30 bg-tinta/10 align-[-2px]" />Inactiva</li>
        <li className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-tinta text-[10px] font-bold text-white">2</span>
          Reservas de hoy
        </li>
      </ul>
    </div>
  );
}