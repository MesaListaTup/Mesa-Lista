'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatFecha, formatHora } from '@/lib/utils';
import Badge from '@/components/admin/Badge';

export default function ReservasTable({ reservas, mesas }) {
  const supabase = createClient();
  const router = useRouter();
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(null);

  async function actualizar(id, cambios) {
    setOcupado(id);
    setError('');
    const { error } = await supabase.from('reservas').update(cambios).eq('id', id);
    setOcupado(null);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta reserva definitivamente?')) return;
    setOcupado(id);
    const { error } = await supabase.from('reservas').delete().eq('id', id);
    setOcupado(null);
    if (error) return setError(error.message);
    router.refresh();
  }

  if (reservas.length === 0) {
    return <p className="panel text-sm text-tinta/70">No hay reservas en esta vista.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-tinta/10 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-tinta/10 bg-tinta/5 text-xs text-tinta/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha y hora</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Personas</th>
              <th className="px-4 py-3 font-semibold">Mesa</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta/10">
            {reservas.map((r) => {
              const activa = r.estado === 'pendiente' || r.estado === 'confirmada';
              return (
                <tr key={r.id} className={ocupado === r.id ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="capitalize">{formatFecha(r.fecha_reserva)}</span>{' '}
                    <span className="font-semibold tabular-nums">{formatHora(r.hora_reserva)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.nombre_cliente}</p>
                    <a href={`tel:${r.telefono_cliente}`} className="text-xs text-tinta/60 hover:underline">{r.telefono_cliente}</a>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.cantidad_personas}</td>
                  <td className="px-4 py-3">
                    <select
                      aria-label="Mesa asignada"
                      value={r.mesa_id ?? ''}
                      disabled={!activa}
                      onChange={(e) => actualizar(r.id, { mesa_id: e.target.value || null })}
                      className="rounded-md border border-tinta/25 bg-white px-2 py-1 text-sm disabled:bg-transparent disabled:border-transparent"
                    >
                      <option value="">Sin mesa</option>
                      {mesas
                        .filter((m) => m.capacidad >= r.cantidad_personas || m.id === r.mesa_id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            Mesa {m.numero_mesa} ({m.capacidad})
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3"><Badge estado={r.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.estado === 'pendiente' && (
                        <button onClick={() => actualizar(r.id, { estado: 'confirmada' })} className="btn btn-dark btn-sm">Confirmar</button>
                      )}
                      {r.estado === 'confirmada' && (
                        <button onClick={() => actualizar(r.id, { estado: 'completada' })} className="btn btn-dark btn-sm">Completar</button>
                      )}
                      {activa && (
                        <button onClick={() => actualizar(r.id, { estado: 'cancelada' })} className="btn btn-ghost btn-sm text-tomate">Cancelar</button>
                      )}
                      {r.estado === 'cancelada' && (
                        <button onClick={() => eliminar(r.id)} className="btn btn-ghost btn-sm">Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
