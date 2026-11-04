'use client';

import { abrirReserva } from '@/lib/reserva-evento';

// Botón que abre el modal de reservas (usado en el hero)
export default function BotonReservas({ className = '', style, children }) {
  return (
    <button type="button" onClick={abrirReserva} className={className} style={style}>
      {children}
    </button>
  );
}
