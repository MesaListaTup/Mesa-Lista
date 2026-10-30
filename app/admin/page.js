import { createClient } from '@/lib/supabase/server';
import { hoyAR, sumarDias, inicioDiaAR, formatHora, formatPrecio, fechaAR } from '@/lib/utils';
import Badge from '@/components/admin/Badge';

// Alturas de los gráficos según el tamaño de pantalla (más altos cuanto más grande es la ventana)
const ALTURA = 'h-60 sm:h-72 lg:h-80 2xl:h-[26rem]';

const ESTADOS = [
  { id: 'pendiente', label: 'Pendientes', barra: 'bg-limon' },
  { id: 'confirmada', label: 'Confirmadas', barra: 'bg-emerald-600' },
  { id: 'completada', label: 'Completadas', barra: 'bg-tinta/40' },
  { id: 'cancelada', label: 'Canceladas', barra: 'bg-tomate' },
];

function diaCorto(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'short' });
}

function Barras({ datos, formato = (v) => v, etiquetaAria }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className={`relative mt-6 ${ALTURA}`} role="img" aria-label={etiquetaAria}>
      {/* líneas guía */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-t border-dashed border-tinta/10" />
        ))}
      </div>
      <div className="relative flex h-full items-end gap-2 sm:gap-4">
        {datos.map((d) => (
          <div key={d.etiqueta} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="truncate text-xs font-semibold tabular-nums sm:text-sm">{formato(d.valor)}</span>
            <div
              className={`w-full max-w-[4.5rem] rounded-t ${d.resaltar ? 'bg-tomate' : 'bg-tinta'}`}
              style={{ height: `${Math.max((d.valor / max) * 78, 1.5)}%` }}
            />
            <span className="h-5 text-xs capitalize text-tinta/60">{d.etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const supabase = createClient();
  const hoy = hoyAR();
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));
  const diasVentas = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i - 6));

  const [reservasRes, mesasRes, pedidosRes] = await Promise.all([
    supabase
      .from('reservas')
      .select('id,fecha_reserva,hora_reserva,nombre_cliente,cantidad_personas,estado,mesas(numero_mesa)')
      .gte('fecha_reserva', hoy)
      .lte('fecha_reserva', dias[6])
      .order('hora_reserva'),
    supabase.from('mesas').select('id,estado'),
    supabase.from('pedidos').select('total,created_at').gte('created_at', `${diasVentas[0]}T00:00:00-03:00`),
  ]);

  const todas = reservasRes.data ?? [];
  const reservas = todas.filter((r) => r.estado !== 'cancelada'); // las canceladas no cuentan en agenda ni en barras
  const mesas = mesasRes.data ?? [];
  const pedidos7 = pedidosRes.data ?? [];
  const pedidosHoy = pedidos7.filter((p) => p.created_at >= inicioDiaAR());

  const reservasHoy = reservas.filter((r) => r.fecha_reserva === hoy);
  const pendientes = reservas.filter((r) => r.estado === 'pendiente').length;
  const mesasActivas = mesas.filter((m) => m.estado !== 'inactiva').length;
  const mesasOcupadas = mesas.filter((m) => m.estado === 'ocupada').length;
  const ventas = pedidosHoy.reduce((acc, p) => acc + Number(p.total), 0);

  const porDia = dias.map((d) => ({
    etiqueta: diaCorto(d),
    valor: reservas.filter((r) => r.fecha_reserva === d).length,
    resaltar: d === hoy,
  }));
  const ventasPorDia = diasVentas.map((d) => ({
    etiqueta: diaCorto(d),
    valor: pedidos7.filter((p) => fechaAR(p.created_at) === d).reduce((acc, p) => acc + Number(p.total), 0),
    resaltar: d === hoy,
  }));
  const porEstado = ESTADOS.map((e) => ({ ...e, total: todas.filter((r) => r.estado === e.id).length }));
  const totalReservas = Math.max(1, todas.length);

  const tarjetas = [
    { titulo: 'Reservas de hoy', valor: reservasHoy.length },
    { titulo: 'Por confirmar (7 días)', valor: pendientes, resaltar: pendientes > 0 },
    { titulo: 'Mesas ocupadas', valor: `${mesasOcupadas} de ${mesasActivas}` },
    { titulo: 'Pedidos de hoy', valor: pedidosHoy.length },
    { titulo: 'Ventas de hoy', valor: formatPrecio(ventas) },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <h1 className="font-display text-4xl">Resumen del día</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
        {tarjetas.map((t) => (
          <div key={t.titulo} className={`panel ${t.resaltar ? 'border-limon bg-limon/20' : ''}`}>
            <p className="text-sm text-tinta/70">{t.titulo}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums xl:text-3xl">{t.valor}</p>
          </div>
        ))}
      </div>

      {/* Escritorio: gráficos grandes en 12 columnas. Tablet y celular: una columna. */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="panel lg:col-span-8">
          <h2 className="font-semibold">Reservas por día, próximos 7 días</h2>
          <Barras datos={porDia} etiquetaAria="Gráfico de barras de reservas por día" />
        </section>

        <section className="panel lg:col-span-4">
          <h2 className="font-semibold">Reservas por estado</h2>
          <p className="text-xs text-tinta/60">Próximos 7 días, incluidas las canceladas</p>
          <ul className="mt-6 space-y-5">
            {porEstado.map((e) => (
              <li key={e.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{e.label}</span>
                  <span className="tabular-nums">{e.total}</span>
                </div>
                <div className="mt-1.5 h-4 rounded bg-tinta/5 lg:h-5">
                  <div className={`h-full rounded ${e.barra}`} style={{ width: `${(e.total / totalReservas) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel lg:col-span-7">
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

        <section className="panel lg:col-span-5">
          <h2 className="font-semibold">Ventas, últimos 7 días</h2>
          <Barras datos={ventasPorDia} formato={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} etiquetaAria="Gráfico de barras de ventas por día" />
        </section>
      </div>
    </div>
  );
}
