import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hoyAR } from '@/lib/utils';
import ReservasTable from './ReservasTable';

const VISTAS = [
  { id: 'proximas', label: 'Próximas' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'todas', label: 'Historial completo' },
];

export default async function ReservasPage({ searchParams }) {
  const vista = VISTAS.some((v) => v.id === searchParams?.vista) ? searchParams.vista : 'proximas';
  const supabase = createClient();
  const hoy = hoyAR();

  let query = supabase
    .from('reservas')
    .select('id,nombre_cliente,telefono_cliente,fecha_reserva,hora_reserva,cantidad_personas,estado,mesa_id,mesas(numero_mesa)')
    .order('fecha_reserva', { ascending: vista !== 'todas' })
    .order('hora_reserva', { ascending: vista !== 'todas' });

  if (vista === 'hoy') query = query.eq('fecha_reserva', hoy);
  if (vista === 'proximas') query = query.gte('fecha_reserva', hoy);

  const [{ data: reservas, error }, { data: mesas }] = await Promise.all([
    query,
    supabase.from('mesas').select('id,numero_mesa,capacidad').neq('estado', 'inactiva').order('numero_mesa'),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Reservas</h1>

      <div className="flex flex-wrap gap-2">
        {VISTAS.map((v) => (
          <Link
            key={v.id}
            href={`/admin/reservas?vista=${v.id}`}
            className={`btn btn-sm ${vista === v.id ? 'btn-dark' : 'btn-ghost'}`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {error && <p className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">No se pudieron cargar las reservas: {error.message}</p>}
      <ReservasTable reservas={reservas ?? []} mesas={mesas ?? []} />
    </div>
  );
}
