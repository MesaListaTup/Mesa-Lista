const ESTILOS = {
  pendiente: 'bg-limon/50 text-tinta',
  confirmada: 'bg-sifon text-tinta',
  completada: 'bg-tinta/10 text-tinta',
  cancelada: 'bg-tomate/15 text-tomate',
  preparando: 'bg-limon/50 text-tinta',
  entregado: 'bg-sifon text-tinta',
  libre: 'bg-sifon text-tinta',
  reservada: 'bg-limon/50 text-tinta',
  ocupada: 'bg-tomate/15 text-tomate',
  inactiva: 'bg-tinta/10 text-tinta/60',
};

const TEXTOS = {
  libre: 'Libre',
  reservada: 'Reservada',
  ocupada: 'Ocupada',
  inactiva: 'Inactiva',
};

export default function Badge({ estado }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold capitalize ${ESTILOS[estado] ?? 'bg-tinta/10'}`}>
      {TEXTOS[estado] ?? estado}
    </span>
  );
}
