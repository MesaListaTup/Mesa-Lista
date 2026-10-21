import { createClient } from '@/lib/supabase/server';
import { hoyAR, minutosAhoraAR, horaAMinutos, formatHora } from '@/lib/utils';
import MesasGrid from './MesasGrid';

export default async function MesasPage() {
  const supabase = createClient();

  const [{ data: mesas }, { data: reservasHoy }] = await Promise.all([
    supabase.from('mesas').select('id,numero_mesa,capacidad,estado').order('numero_mesa'),
    supabase
      .from('reservas')
      .select('mesa_id,hora_reserva')
      .eq('fecha_reserva', hoyAR())
      .in('estado', ['pendiente', 'confirmada'])
      .not('mesa_id', 'is', null)
      .order('hora_reserva'),
  ]);

  // Una mesa libre se muestra como "Reservada" si tiene una reserva activa hoy que no terminó (2 h de duración)
  const ahora = minutosAhoraAR();
  const proximaReserva = new Map();
  (reservasHoy ?? []).forEach((r) => {
    if (horaAMinutos(r.hora_reserva) + 120 > ahora && !proximaReserva.has(r.mesa_id)) {
      proximaReserva.set(r.mesa_id, formatHora(r.hora_reserva));
    }
  });

  const lista = (mesas ?? []).map((m) => ({
    ...m,
    vista: m.estado === 'inactiva' ? 'inactiva' : m.estado === 'ocupada' ? 'ocupada' : proximaReserva.has(m.id) ? 'reservada' : 'libre',
    horaReserva: proximaReserva.get(m.id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Mesas</h1>
      <MesasGrid mesas={lista} />
    </div>
  );
}
