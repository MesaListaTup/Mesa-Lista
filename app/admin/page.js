import { createClient } from '@/lib/supabase/server';
import { hoyAR, sumarDias, inicioDiaAR, minutosAhoraAR } from '@/lib/utils';
import DashboardView from '@/components/admin/DashboardView';

export default async function Dashboard() {
  const supabase = createClient();
  const hoy = hoyAR();
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [reservasRes, mesasRes, pedidosRes, perfilRes] = await Promise.all([
    supabase
      .from('reservas')
      .select('id,fecha_reserva,hora_reserva,nombre_cliente,cantidad_personas,estado,mesas(numero_mesa)')
      .gte('fecha_reserva', hoy)
      .lte('fecha_reserva', dias[6])
      .neq('estado', 'cancelada')
      .order('hora_reserva'),
    supabase.from('mesas').select('id,estado'),
    supabase.from('pedidos').select('total').gte('created_at', inicioDiaAR()),
    user ? supabase.from('users').select('nombre').eq('id', user.id).single() : Promise.resolve({ data: null }),
  ]);

  const reservas = reservasRes.data ?? [];
  const mesas = mesasRes.data ?? [];
  const pedidos = pedidosRes.data ?? [];

  const reservasHoy = reservas.filter((r) => r.fecha_reserva === hoy);
  const pendientes = reservas.filter((r) => r.estado === 'pendiente').length;
  const mesasActivas = mesas.filter((m) => m.estado !== 'inactiva').length;
  const mesasOcupadas = mesas.filter((m) => m.estado === 'ocupada').length;
  const ventas = pedidos.reduce((acc, p) => acc + Number(p.total), 0);

  const porDia = dias.map((d) => ({
    dia: d,
    total: reservas.filter((r) => r.fecha_reserva === d).length,
    etiqueta: new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', ''),
    largo: new Date(`${d}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
  }));

  const estadosMesas = ['libre', 'reservada', 'ocupada', 'inactiva'].map((estado) => ({
    estado,
    cantidad: mesas.filter((m) => m.estado === estado).length,
  }));

  const hora = minutosAhoraAR() / 60;
  const saludo = hora < 12 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <DashboardView
      saludo={saludo}
      nombre={perfilRes.data?.nombre?.split(' ')[0] ?? null}
      fechaHoy={fechaHoy}
      hoy={hoy}
      stats={{
        reservasHoy: reservasHoy.length,
        pendientes,
        mesasOcupadas,
        mesasActivas,
        pedidos: pedidos.length,
        ventas,
      }}
      porDia={porDia}
      estadosMesas={estadosMesas}
      agenda={reservasHoy.map((r) => ({
        id: r.id,
        hora: r.hora_reserva,
        nombre: r.nombre_cliente,
        personas: r.cantidad_personas,
        mesa: r.mesas?.numero_mesa ?? null,
        estado: r.estado,
      }))}
    />
  );
}