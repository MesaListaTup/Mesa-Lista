import { createClient } from '@/lib/supabase/server';
import { hoyAR, sumarDias, inicioDiaAR, formatHora, formatPrecio } from '@/lib/utils';
import Badge from '@/components/admin/Badge';

export default async function Dashboard() {
  const supabase = createClient();
  const hoy = hoyAR();
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));

  const [reservasRes, mesasRes, pedidosRes] = await Promise.all([
    supabase
      .from('reservas')
      .select('id,fecha_reserva,hora_reserva,nombre_cliente,cantidad_personas,estado,mesas(numero_mesa)')
      .gte('fecha_reserva', hoy)
      .lte('fecha_reserva', dias[6])
      .neq('estado', 'cancelada')
      .order('hora_reserva'),
    supabase.from('mesas').select('id,estado'),
    supabase.from('pedidos').select('total').gte('created_at', inicioDiaAR()),
  ]);

  const reservas = reservasRes.data ?? [];
  const mesas = mesasRes.data ?? [];
  const pedidos = pedidosRes.data ?? [];

  const reservasHoy = reservas.filter((r) => r.fecha_reserva === hoy);
  const pendientes = reservas.filter((r) => r.estado === 'pendiente').length;
  const mesasActivas = mesas.filter((m) => m.estado !== 'inactiva').length;
  const mesasOcupadas = mesas.filter((m) => m.estado === 'ocupada').length;
  const ventas = pedidos.reduce((acc, p) => acc + Number(p.total), 0);

  const porDia = dias.map((d) => ({ dia: d, total: reservas.filter((r) => r.fecha_reserva === d).length }));
  const max = Math.max(1, ...porDia.map((d) => d.total));

  const tarjetas = [
    { titulo: 'Reservas de hoy', valor: reservasHoy.length },
    { titulo: 'Por confirmar (7 días)', valor: pendientes, resaltar: pendientes > 0 },
    { titulo: 'Mesas ocupadas', valor: `${mesasOcupadas} de ${mesasActivas}` },
    { titulo: 'Pedidos de hoy', valor: pedidos.length },
    { titulo: 'Ventas de hoy', valor: formatPrecio(ventas) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">Resumen del día</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {tarjetas.map((t) => (
          <div key={t.titulo} className={`panel ${t.resaltar ? 'border-limon bg-limon/20' : ''}`}>
            <p className="text-sm text-tinta/70">{t.titulo}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{t.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="font-semibold">Reservas por día, próximos 7 días</h2>
          <div className="mt-6 flex h-44 items-end gap-3" role="img" aria-label="Gráfico de barras de reservas por día">
            {porDia.map((d) => (
              <div key={d.dia} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-semibold tabular-nums">{d.total}</span>
                <div
                  className={`w-full rounded-t ${d.dia === hoy ? 'bg-tomate' : 'bg-tinta'}`}
                  style={{ height: `${Math.max((d.total / max) * 100, 2)}%` }}
                />
                <span className="text-[11px] text-tinta/60">
                  {new Date(`${d.dia}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 className="font-semibold">Agenda de hoy</h2>
          {reservasHoy.length === 0 ? (
            <p className="mt-4 text-sm text-tinta/60">No hay reservas para hoy.</p>
          ) : (
            <ul className="mt-3 divide-y divide-tinta/10">
              {reservasHoy.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <span className="font-semibold tabular-nums">{formatHora(r.hora_reserva)}</span>{' '}
                    {r.nombre_cliente}
                    <span className="text-tinta/60">
                      {' '}· {r.cantidad_personas} pers.{r.mesas ? `, mesa ${r.mesas.numero_mesa}` : ''}
                    </span>
                  </div>
                  <Badge estado={r.estado} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
