'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/admin/Badge';

const FONDO = {
  libre: 'border-sifon bg-sifon/40',
  reservada: 'border-limon bg-limon/25',
  ocupada: 'border-tomate/40 bg-tomate/10',
  inactiva: 'border-tinta/15 bg-tinta/5 text-tinta/60',
};

export default function MesasGrid({ mesas }) {
  const supabase = createClient();
  const router = useRouter();
  const [error, setError] = useState('');
  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState(4);

  async function cambiarEstado(id, estado) {
    setError('');
    const { error } = await supabase.from('mesas').update({ estado }).eq('id', id);
    if (error) return setError(error.message);
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

  async function eliminar(m) {
    if (!confirm(`¿Eliminar la mesa ${m.numero_mesa}?`)) return;
    const { error } = await supabase.from('mesas').delete().eq('id', m.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  const conteo = (v) => mesas.filter((m) => m.vista === v).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-sm">
        {['libre', 'reservada', 'ocupada', 'inactiva'].map((v) => (
          <span key={v} className="flex items-center gap-2 rounded-md border border-tinta/10 bg-white px-3 py-1.5">
            <Badge estado={v} /> <strong className="tabular-nums">{conteo(v)}</strong>
          </span>
        ))}
      </div>

      {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {mesas.map((m) => (
          <div key={m.id} className={`rounded-lg border-2 p-4 ${FONDO[m.vista]}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-3xl leading-none">{m.numero_mesa}</p>
                <p className="mt-1 text-sm text-tinta/70">{m.capacidad} personas</p>
              </div>
              <Badge estado={m.vista} />
            </div>
            {m.vista === 'reservada' && <p className="mt-2 text-xs">Reserva a las {m.horaReserva} hs</p>}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {m.estado === 'disponible' && (
                <button onClick={() => cambiarEstado(m.id, 'ocupada')} className="btn btn-dark btn-sm">Ocupar</button>
              )}
              {m.estado === 'ocupada' && (
                <button onClick={() => cambiarEstado(m.id, 'disponible')} className="btn btn-dark btn-sm">Liberar</button>
              )}
              {m.estado === 'inactiva' ? (
                <button onClick={() => cambiarEstado(m.id, 'disponible')} className="btn btn-ghost btn-sm">Activar</button>
              ) : (
                <button onClick={() => cambiarEstado(m.id, 'inactiva')} className="btn btn-ghost btn-sm">Desactivar</button>
              )}
              <button onClick={() => eliminar(m)} className="btn btn-ghost btn-sm text-tomate">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={agregar} className="panel flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="n" className="label">Número de mesa</label>
          <input id="n" type="number" min="1" required value={numero} onChange={(e) => setNumero(e.target.value)} className="input w-32" />
        </div>
        <div>
          <label htmlFor="c" className="label">Capacidad</label>
          <input id="c" type="number" min="1" max="20" required value={capacidad} onChange={(e) => setCapacidad(e.target.value)} className="input w-32" />
        </div>
        <button className="btn btn-dark">Agregar mesa</button>
      </form>
    </div>
  );
}
