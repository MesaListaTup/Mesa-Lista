import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hoyAR } from '@/lib/utils';
import ReservasTable from './ReservasTable';

const VISTAS = [
  { id: 'proximas', label: 'Próximas' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'todas', label: 'Historial completo' },
];

const ESTADOS = [
  { id: 'todas', label: 'Todas', punto: 'bg-tinta', ayuda: '' },
  { id: 'pendiente', label: 'Pendientes', punto: 'bg-limon', ayuda: 'esperan confirmación' },
  { id: 'confirmada', label: 'Confirmadas', punto: 'bg-emerald-600', ayuda: 'mesa asegurada' },
  { id: 'completada', label: 'Completadas', punto: 'bg-tinta/40', ayuda: 'ya atendidas' },
  { id: 'cancelada', label: 'Canceladas', punto: 'bg-tomate', ayuda: 'mesa liberada' },
];

export default async function ReservasPage({ searchParams }) {
  const vista = VISTAS.some((v) => v.id === searchParams?.vista) ? searchParams.vista : 'proximas';
  const estado = ESTADOS.some((e) => e.id === searchParams?.estado) ? searchParams.estado : 'todas';
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

  const todas = reservas ?? [];
  const conteo = (id) => (id === 'todas' ? todas.length : todas.filter((r) => r.estado === id).length);
  const visibles = estado === 'todas' ? todas : todas.filter((r) => r.estado === estado);

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

      {/* Filtro por estado, con cantidad y significado de cada uno */}
      <div className="rounded-lg border border-tinta/10 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta/60">Filtrar por estado</p>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <Link
              key={e.id}
              href={`/admin/reservas?vista=${vista}&estado=${e.id}`}
              aria-current={estado === e.id ? 'true' : undefined}
              title={e.ayuda}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium ${
                estado === e.id ? 'border-tinta bg-tinta text-white' : 'border-tinta/20 bg-white hover:bg-tinta/5'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${e.punto} ${estado === e.id ? 'ring-2 ring-white/60' : ''}`} aria-hidden="true" />
              {e.label}
              <span className="tabular-nums opacity-70">{conteo(e.id)}</span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-tinta/60">
          Pendiente: espera confirmación · Confirmada: mesa asegurada · Completada: ya atendida · Cancelada: se liberó la mesa.
          Cada reserva ocupa la mesa 2 horas.
        </p>
      </div>

      {error && <p className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">No se pudieron cargar las reservas: {error.message}</p>}
      <ReservasTable reservas={visibles} mesas={mesas ?? []} />
    </div>
  );
}
