// Estados con color + icono + texto (no dependen solo del color).
const ESTILOS = {
  // reservas
  pendiente: 'bg-limon/50 text-tinta',
  confirmada: 'bg-emerald-100 text-emerald-900',
  completada: 'bg-tinta/10 text-tinta',
  cancelada: 'bg-tomate/15 text-tomate',
  // pedidos
  preparando: 'bg-limon/50 text-tinta',
  entregado: 'bg-emerald-100 text-emerald-900',
  // mesas
  libre: 'bg-emerald-100 text-emerald-900',
  reservada: 'bg-limon/50 text-tinta',
  ocupada: 'bg-tomate/15 text-tomate',
  inactiva: 'bg-tinta/10 text-tinta/60',
  // pagos (Mercado Pago)
  pago_sin_pagar: 'bg-tinta/10 text-tinta/70',
  pago_pendiente: 'bg-limon/50 text-tinta',
  pago_aprobado: 'bg-emerald-100 text-emerald-900',
  pago_rechazado: 'bg-tomate/15 text-tomate',
  pago_cancelado: 'bg-tomate/15 text-tomate',
  pago_reembolsado: 'bg-sky-100 text-sky-900',
};

const TEXTOS = {
  libre: 'Libre',
  reservada: 'Reservada',
  ocupada: 'Ocupada',
  inactiva: 'Inactiva',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  pago_sin_pagar: 'Sin cobrar',
  pago_pendiente: 'Pago en proceso',
  pago_aprobado: 'Pagado',
  pago_rechazado: 'Pago rechazado',
  pago_cancelado: 'Pago cancelado',
  pago_reembolsado: 'Reembolsado',
};

const AYUDA = {
  pendiente: 'Esperando que el local la confirme',
  confirmada: 'Mesa asegurada para el cliente',
  completada: 'El cliente ya fue atendido',
  cancelada: 'Cancelada: la mesa quedó libre',
};

// Iconos de 12 px (trazos simples)
const ICONOS = {
  pendiente: <path d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" />,
  confirmada: <path d="M5 12l5 5 9-10" />,
  completada: <path d="M3 12l4 4 6-8M12 16l2 2 7-10" />,
  cancelada: <path d="M6 6l12 12M18 6L6 18" />,
  pago_aprobado: <path d="M5 12l5 5 9-10" />,
  pago_rechazado: <path d="M6 6l12 12M18 6L6 18" />,
  pago_pendiente: <path d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" />,
};

export default function Badge({ estado }) {
  const icono = ICONOS[estado];
  return (
    <span
      title={AYUDA[estado]}
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold capitalize ${ESTILOS[estado] ?? 'bg-tinta/10'}`}
    >
      {icono && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icono}
        </svg>
      )}
      {TEXTOS[estado] ?? estado}
    </span>
  );
}
