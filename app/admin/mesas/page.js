import { createClient } from '@/lib/supabase/server';
import { hoyAR, sumarDias, minutosAhoraAR, horaAMinutos, formatHora } from '@/lib/utils';
import MesasGrid from './MesasGrid';

export default async function MesasPage() {
  const supabase = createClient();
  const hoy = hoyAR();

  const [{ data: mesas, error: errorMesas }, { data: reservas }] = await Promise.all([
    supabase
      .from('mesas')
      .select('id,numero_mesa,capacidad,estado,posicion')
      .order('posicion', { ascending: true, nullsFirst: false })
      .order('numero_mesa'),
    // Reservas activas con mesa asignada: hoy y los próximos 30 días
    supabase
      .from('reservas')
      .select('id,mesa_id,nombre_cliente,telefono_cliente,fecha_reserva,hora_reserva,cantidad_personas,estado')
      .gte('fecha_reserva', hoy)
      .lte('fecha_reserva', sumarDias(hoy, 30))
      .in('estado', ['pendiente', 'confirmada'])
      .not('mesa_id', 'is', null)
      .order('fecha_reserva')
      .order('hora_reserva'),
  ]);

  if (errorMesas) {
    return (
      <div className="rounded-md bg-tomate/10 p-4 text-sm text-tomate" role="alert">
        No se pudieron cargar las mesas: {errorMesas.message}. Si el mensaje menciona la columna &quot;posicion&quot;, ejecutá
        supabase/v4_reglas_mesas.sql en el SQL Editor de Supabase.
      </div>
    );
  }

  const ahora = minutosAhoraAR();

  const lista = (mesas ?? []).map((m) => {
    const deEstaMesa = (reservas ?? []).filter((r) => r.mesa_id === m.id);
    const deHoy = deEstaMesa.filter((r) => r.fecha_reserva === hoy);
    const proximas = deEstaMesa.filter((r) => r.fecha_reserva > hoy);

    // "Reservada": tiene una reserva hoy que todavía no terminó (cada reserva dura 2 h)
    const vigente = deHoy.find((r) => horaAMinutos(r.hora_reserva) + 120 > ahora);

    return {
      ...m,
      vista: m.estado === 'inactiva' ? 'inactiva' : m.estado === 'ocupada' ? 'ocupada' : vigente ? 'reservada' : 'libre',
      horaReserva: vigente ? formatHora(vigente.hora_reserva) : null,
      hoy: deHoy,
      proximas,
    };
  });

  return <MesasGrid mesas={lista} />;
}