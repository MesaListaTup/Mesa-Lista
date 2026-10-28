'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hoyAR, formatFecha, formatHora } from '@/lib/utils';
import PlanoMesas from './PlanoMesas';

export default function ReservaForm() {
  const supabase = createClient();
  const hoy = hoyAR();

  const [fecha, setFecha] = useState(hoy);
  const [personas, setPersonas] = useState(2);
  const [slots, setSlots] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [hora, setHora] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [reserva, setReserva] = useState(null);
  const [mesas, setMesas] = useState([]);
  const [mesaId, setMesaId] = useState('');
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [errorPlano, setErrorPlano] = useState(false);

  // Cada vez que cambia el día o la cantidad de personas, consultamos los horarios con mesa libre
  useEffect(() => {
    if (!fecha) return;
    let cancelado = false;
    setCargando(true);
    setHora('');
    supabase
      .rpc('horarios_disponibles', { p_fecha: fecha, p_personas: personas })
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setError('No pudimos consultar los horarios. Probá de nuevo en un momento.');
        else {
          setError('');
          setSlots(data ?? []);
        }
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, personas]);

  // Cuando hay un horario elegido, consultamos qué mesas están libres para pintar el plano
  async function cargarMesas(h, cancelado = () => false) {
    setCargandoMesas(true);
    const { data, error } = await supabase.rpc('mesas_disponibilidad', {
      p_fecha: fecha,
      p_hora: h,
      p_personas: personas,
    });
    if (cancelado()) return;
    setCargandoMesas(false);
    if (error) {
      setMesas([]);
      setErrorPlano(true);
      return;
    }
    setErrorPlano(false);
    setMesas(data ?? []);
    // Si la mesa elegida dejó de estar libre, se deselecciona
    setMesaId((actual) => {
      const m = (data ?? []).find((x) => x.id === actual);
      return m && m.libre && m.capacidad >= personas ? actual : '';
    });
  }

  useEffect(() => {
    let cancelado = false;
    if (!hora) {
      setMesas([]);
      setMesaId('');
      return;
    }
    cargarMesas(hora, () => cancelado);
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, hora, personas]);

  async function enviar(e) {
    e.preventDefault();
    if (!hora) return setError('Elegí un horario.');
    setEnviando(true);
    setError('');
    const { error } = await supabase.rpc('crear_reserva', {
      p_nombre: nombre,
      p_telefono: telefono,
      p_fecha: fecha,
      p_hora: hora,
      p_personas: personas,
      p_mesa_id: mesaId || null,
    });
    setEnviando(false);
    if (error) {
      setError(error.message);
      cargarMesas(hora); // por si alguien tomó la mesa mientras tanto
      return;
    }
    setReserva({ nombre, fecha, hora, personas, mesa: mesas.find((m) => m.id === mesaId)?.numero_mesa ?? null });
  }

  if (reserva) {
    return (
      <div className="rounded-lg bg-white p-7 shadow-xl">
        <h2 className="font-display text-3xl">¡Recibimos tu reserva, {reserva.nombre.split(' ')[0]}!</h2>
        <p className="mt-3 text-tinta/80">
          {formatFecha(reserva.fecha)} a las {formatHora(reserva.hora)} hs para {reserva.personas}{' '}
          {reserva.personas === 1 ? 'persona' : 'personas'}
          {reserva.mesa ? `, en la mesa ${reserva.mesa}` : ''}.
        </p>
        <p className="mt-2 text-sm text-tinta/70">
          Queda pendiente hasta que el local la confirme. Si necesitamos algo, te llamamos al teléfono que dejaste.
        </p>
        <button
          className="btn btn-dark mt-6"
          onClick={() => {
            setReserva(null);
            setNombre('');
            setTelefono('');
            setMesaId('');
          }}
        >
          Hacer otra reserva
        </button>
      </div>
    );
  }

  const almuerzo = slots.filter((s) => s.hora < '15:00:00');
  const cena = slots.filter((s) => s.hora >= '15:00:00');
  const sinLugar = !cargando && slots.length > 0 && slots.every((s) => !s.disponible);

  return (
    <form onSubmit={enviar} className="rounded-lg bg-white p-6 shadow-xl sm:p-7" id="reservar">
      <h2 className="font-display text-2xl">Reservá tu mesa</h2>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha" className="label">Día</label>
          <input
            id="fecha"
            type="date"
            required
            min={hoy}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="personas" className="label">Personas</label>
          <select
            id="personas"
            value={personas}
            onChange={(e) => setPersonas(Number(e.target.value))}
            className="input"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5" aria-live="polite">
        <span className="label">Horario</span>
        {cargando ? (
          <p className="text-sm text-tinta/60">Buscando mesas libres…</p>
        ) : sinLugar ? (
          <p className="rounded-md bg-limon/40 p-3 text-sm">
            No quedan mesas para {personas} {personas === 1 ? 'persona' : 'personas'} ese día. Probá con otra fecha.
          </p>
        ) : (
          [['Almuerzo', almuerzo], ['Cena', cena]].map(([titulo, lista]) => (
            <div key={titulo} className="mb-3">
              <p className="mb-1.5 text-xs font-medium text-tinta/60">{titulo}</p>
              <div className="flex flex-wrap gap-2">
                {lista.map((s) => (
                  <button
                    type="button"
                    key={s.hora}
                    disabled={!s.disponible}
                    onClick={() => setHora(s.hora)}
                    aria-pressed={hora === s.hora}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-tinta/10 disabled:text-tinta/30 disabled:line-through ${
                      hora === s.hora
                        ? 'border-tinta bg-tinta text-white'
                        : 'border-tinta/25 bg-white hover:border-tinta'
                    }`}
                  >
                    {formatHora(s.hora)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {hora && (
        <div className="mt-2">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="label !mb-0">
              Tu mesa <span className="font-normal text-tinta/60">(opcional)</span>
            </span>
            {mesaId && (
              <button type="button" onClick={() => setMesaId('')} className="text-xs underline underline-offset-2 hover:text-tomate">
                Que la asignen ustedes
              </button>
            )}
          </div>

          {cargandoMesas && mesas.length === 0 ? (
            <p className="text-sm text-tinta/60">Dibujando el salón…</p>
          ) : errorPlano || mesas.length === 0 ? (
            <p className="rounded-md bg-sifon p-3 text-sm">
              No pudimos mostrar el plano, pero igual podés reservar y te asignamos la mejor mesa libre.
            </p>
          ) : (
            <>
              <PlanoMesas mesas={mesas} personas={personas} seleccionada={mesaId} onSelect={setMesaId} />
              <p className="mt-2 text-sm" aria-live="polite">
                {mesaId
                  ? `Elegiste la mesa ${mesas.find((m) => m.id === mesaId)?.numero_mesa}.`
                  : 'Tocá una mesa libre para elegirla, o seguí y te asignamos la mejor.'}
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="label">Nombre</label>
          <input id="nombre" required minLength={2} value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="telefono" className="label">Teléfono</label>
          <input id="telefono" type="tel" required minLength={6} value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input" autoComplete="tel" placeholder="11 5555 0123" />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>
      )}

      <button type="submit" disabled={enviando || !hora} className="btn btn-primary mt-5 w-full py-3 text-base">
        {enviando ? 'Reservando…' : 'Reservar mesa'}
      </button>
    </form>
  );
}
