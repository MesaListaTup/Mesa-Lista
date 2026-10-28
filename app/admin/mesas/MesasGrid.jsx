'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatFecha, formatHora } from '@/lib/utils';
import Badge from '@/components/admin/Badge';
import PlanoAdmin from '@/components/admin/PlanoAdmin';

const MAX_PROXIMAS = 5;

// Cada reserva ocupa la mesa 2 horas
function horaFin(hora) {
  const [h, m] = hora.split(':').map(Number);
  const total = (h * 60 + m + 120) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function MesasGrid({ mesas }) {
  const supabase = createClient();
  const router = useRouter();
  const [error, setError] = useState('');
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState(4);

  // Edición del plano: el orden se arma en pantalla y recién se guarda al tocar "Guardar cambios"
  const [editando, setEditando] = useState(false);
  const [orden, setOrden] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [esperandoRefresco, setEsperandoRefresco] = useState(false);

  const mesasPlano = editando ? orden : mesas;
  const hayCambios = editando && orden.some((m, i) => m.id !== mesas[i]?.id);
  const sel = editando ? null : mesas.find((m) => m.id === seleccionadaId) ?? null;
  const conteo = (v) => mesas.filter((m) => m.vista === v).length;

  // Cuando el servidor devuelve el orden nuevo, se sale del modo edición (evita un parpadeo con el orden viejo)
  useEffect(() => {
    if (esperandoRefresco && mesas.length === orden.length && mesas.every((m, i) => m.id === orden[i].id)) {
      setEsperandoRefresco(false);
      setEditando(false);
    }
  }, [mesas, orden, esperandoRefresco]);

  function empezarEdicion() {
    setError('');
    setSeleccionadaId(null);
    setOrden(mesas);
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    setEsperandoRefresco(false);
    setGuardando(false);
  }

  async function guardarOrden() {
    setError('');
    setGuardando(true);
    const { error } = await supabase.rpc('guardar_orden_mesas', { p_ids: orden.map((m) => m.id) });
    setGuardando(false);
    if (error) return setError(error.message);
    setEsperandoRefresco(true);
    router.refresh();
  }

  async function cambiarEstado(m, estado) {
    setError('');
    const activas = m.hoy.length + m.proximas.length;
    if (estado === 'inactiva' && activas > 0) {
      const ok = confirm(
        `La mesa ${m.numero_mesa} tiene ${activas} ${activas === 1 ? 'reserva activa' : 'reservas activas'}. ` +
        'Si la desactivás, reasignalas desde la sección Reservas. ¿Desactivar igual?'
      );
      if (!ok) return;
    }
    const { error } = await supabase.from('mesas').update({ estado }).eq('id', m.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function eliminar(m) {
    const activas = m.hoy.length + m.proximas.length;
    const aviso = activas > 0 ? ` Tiene ${activas} ${activas === 1 ? 'reserva activa' : 'reservas activas'} que quedarán sin mesa asignada.` : '';
    if (!confirm(`¿Eliminar la mesa ${m.numero_mesa}?${aviso}`)) return;
    setError('');
    const { error } = await supabase.from('mesas').delete().eq('id', m.id);
    if (error) return setError(error.message);
    setSeleccionadaId(null);
    router.refresh();
  }

  async function agregar(e) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.from('mesas').insert({ numero_mesa: Number(numero), capacidad: Number(capacidad) });
    if (error) return setError(error.code === '23505' ? 'Ya existe una mesa con ese número.' : error.message);
    setNumero('');
    router.refresh();
  }

  return (
    // En escritorio ocupa exactamente el alto de la pantalla (menos el padding del panel): sin scroll de página.
    <div className="flex flex-col gap-4 md:h-[calc(100dvh-5rem)]">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <h1 className="font-display text-3xl">Mesas</h1>
          <div className="flex flex-wrap gap-1.5 text-sm">
            {['libre', 'reservada', 'ocupada', 'inactiva'].map((v) => (
              <span key={v} className="flex items-center gap-2 rounded-md border border-tinta/10 bg-white px-2.5 py-1">
                <Badge estado={v} /> <strong className="tabular-nums">{conteo(v)}</strong>
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={agregar} className="flex items-center gap-2">
          <label htmlFor="n" className="sr-only">Número de mesa</label>
          <input id="n" type="number" min="1" required placeholder="N° mesa" value={numero} onChange={(e) => setNumero(e.target.value)} className="input !w-24 !py-1.5" />
          <label htmlFor="c" className="sr-only">Capacidad</label>
          <input id="c" type="number" min="1" max="20" required placeholder="Personas" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} className="input !w-24 !py-1.5" />
          <button className="btn btn-dark btn-sm !py-2">Agregar mesa</button>
        </form>
      </header>

      {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

      <div className="grid gap-4 md:min-h-0 md:flex-1 md:grid-rows-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        {/* Plano: se escala para entrar en el alto disponible */}
        <section className="panel flex min-h-0 flex-col !p-3">
          {mesas.length === 0 ? (
            <p className="p-2 text-sm text-tinta/60">Todavía no hay mesas. Agregá la primera arriba.</p>
          ) : (
            <>
              {/* Barra superior del plano: lápiz para editar, o Guardar/Cancelar en modo edición */}
              <div className="mb-2 flex min-h-9 shrink-0 items-center justify-between gap-3">
                {editando ? (
                  <>
                    <p className="text-sm font-medium">
                      Editando el plano. <span className="font-normal text-tinta/70">Arrastrá una mesa sobre otra para intercambiar sus lugares.</span>
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={cancelarEdicion} className="btn btn-ghost btn-sm">Cancelar</button>
                      <button
                        onClick={guardarOrden}
                        disabled={!hayCambios || guardando || esperandoRefresco}
                        className="btn btn-primary btn-sm"
                      >
                        {guardando || esperandoRefresco ? 'Guardando…' : 'Guardar cambios'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-tinta/70">Plano del salón</p>
                    <button
                      onClick={empezarEdicion}
                      disabled={mesas.length < 2}
                      title="Editar plano"
                      aria-label="Editar la posición de las mesas en el plano"
                      className="btn btn-ghost h-9 w-9 !p-0"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              <PlanoAdmin
                mesas={mesasPlano}
                seleccionada={seleccionadaId}
                onSelect={setSeleccionadaId}
                editando={editando}
                onReorder={setOrden}
              />
            </>
          )}
        </section>

        {/* Detalle: columna fija en pantallas grandes, panel inferior en las chicas */}
        <aside
          aria-live="polite"
          className={`${sel ? 'flex' : 'hidden xl:flex'} panel fixed inset-x-0 bottom-0 z-30 max-h-[60dvh] flex-col gap-3 overflow-hidden rounded-b-none shadow-2xl md:left-60 xl:static xl:z-auto xl:max-h-none xl:min-h-0 xl:rounded-b-lg xl:shadow-none`}
        >
          {!sel ? (
            <p className="text-sm text-tinta/60">
              {editando
                ? 'Mientras editás el plano no se muestran los detalles de las mesas. Con el teclado, usá las flechas sobre una mesa para moverla. Los cambios se ven en la landing recién al guardar.'
                : 'Tocá una mesa del plano para ver sus reservas y administrarla.'}
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl leading-none">Mesa {sel.numero_mesa}</h2>
                  <p className="mt-1 text-sm text-tinta/70">Para {sel.capacidad} personas</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge estado={sel.vista} />
                  <button onClick={() => setSeleccionadaId(null)} aria-label="Cerrar detalle" className="btn btn-ghost btn-sm">Cerrar</button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {sel.estado === 'disponible' && (
                  <button onClick={() => cambiarEstado(sel, 'ocupada')} className="btn btn-dark btn-sm">Ocupar</button>
                )}
                {sel.estado === 'ocupada' && (
                  <button onClick={() => cambiarEstado(sel, 'disponible')} className="btn btn-dark btn-sm">Liberar</button>
                )}
                {sel.estado === 'inactiva' ? (
                  <button onClick={() => cambiarEstado(sel, 'disponible')} className="btn btn-ghost btn-sm">Activar</button>
                ) : (
                  <button onClick={() => cambiarEstado(sel, 'inactiva')} className="btn btn-ghost btn-sm">Desactivar</button>
                )}
                <button onClick={() => eliminar(sel)} className="btn btn-ghost btn-sm text-tomate">Eliminar</button>
              </div>

              {/* Si hubiera muchísimas reservas, solo esta zona hace scroll */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                {/* Reservas de hoy: resaltadas */}
                <section>
                  <h3 className="mb-1.5 text-sm font-semibold">
                    Reservas de hoy <span className="font-normal text-tinta/60">({sel.hoy.length})</span>
                  </h3>
                  {sel.hoy.length === 0 ? (
                    <p className="text-sm text-tinta/60">Sin reservas para hoy.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {sel.hoy.map((r) => (
                        <li key={r.id} className="rounded-md border border-limon bg-limon/25 px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p>
                              <span className="font-bold tabular-nums">{formatHora(r.hora_reserva)}</span>
                              <span className="text-tinta/70"> a {horaFin(r.hora_reserva)} hs</span>
                            </p>
                            <Badge estado={r.estado} />
                          </div>
                          <p className="mt-0.5 text-xs text-tinta/80">
                            <span className="font-medium">{r.nombre_cliente}</span> · {r.cantidad_personas}{' '}
                            {r.cantidad_personas === 1 ? 'persona' : 'personas'} ·{' '}
                            <a href={`tel:${r.telefono_cliente}`} className="hover:underline">{r.telefono_cliente}</a>
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Próximas reservas: apagadas */}
                <section className="text-tinta/55">
                  <h3 className="mb-1.5 text-sm font-semibold">
                    Próximas reservas <span className="font-normal">({sel.proximas.length})</span>
                  </h3>
                  {sel.proximas.length === 0 ? (
                    <p className="text-sm">No hay reservas en los próximos 30 días.</p>
                  ) : (
                    <ul className="space-y-1">
                      {sel.proximas.slice(0, MAX_PROXIMAS).map((r) => (
                        <li key={r.id} className="rounded-md bg-tinta/5 px-3 py-1.5 text-xs">
                          <span className="capitalize">{formatFecha(r.fecha_reserva)}</span>{' '}
                          <span className="font-semibold tabular-nums">{formatHora(r.hora_reserva)}</span>
                          <span> · {r.nombre_cliente} · {r.cantidad_personas} pers.</span>
                          {r.estado === 'pendiente' && <span> (pendiente)</span>}
                        </li>
                      ))}
                      {sel.proximas.length > MAX_PROXIMAS && (
                        <li className="px-1 text-xs">y {sel.proximas.length - MAX_PROXIMAS} más. Verlas en Reservas.</li>
                      )}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}