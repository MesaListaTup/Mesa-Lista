'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Mrs_Saint_Delafield } from 'next/font/google';
import { createClient } from '@/lib/supabase/client';
import { RESTAURANTE } from '@/lib/config';
import { hoyAR, sumarDias, formatFecha, formatHora } from '@/lib/utils';
import { EVENTO_RESERVA } from '@/lib/reserva-evento';
import { PUNTOS_POR_RESERVA } from '@/lib/puntos';
import CalendarioReserva from './CalendarioReserva';
import PlanoMesas, { capacidadMaxima } from './PlanoMesas';
import './reserva.css';

const firma = Mrs_Saint_Delafield({ subsets: ['latin'], weight: '400' });

// Mismos turnos que la función SQL horarios_disponibles (almuerzo y cena, cada 30 min)
const HORARIOS = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
const MAX_PERSONAS = 10; // = capacidad de la mesa más grande. Tiene que coincidir con v_max_personas de supabase/v7_reservas_reglas.sql
const DIAS_CERRADOS = [1]; // lunes (0 = domingo). Si el local cambia de día de descanso, se cambia acá.
const DIAS_ALTERNATIVOS = 7;

const aMinutos = (h) => {
  const [a, b] = h.split(':').map(Number);
  return a * 60 + b;
};
const diaSemana = (f) => new Date(`${f}T12:00:00`).getDay();
const primerDiaAbierto = (desde) => {
  let f = desde;
  for (let i = 0; i < 7 && DIAS_CERRADOS.includes(diaSemana(f)); i++) f = sumarDias(f, 1);
  return f;
};

function Flecha({ dir, ...props }) {
  return (
    <button type="button" {...props} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-tinta/10 disabled:cursor-not-allowed disabled:text-tinta/25 disabled:hover:bg-transparent">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === 'izq' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

// Selector compacto: dos van lado a lado (personas / horario) para ahorrar altura. Flechas de 40px, cómodas con el pulgar.
function Selector({ valor, etiqueta, onMenos, onMas, menosOff, masOff, nombre }) {
  return (
    <div className="flex items-center justify-between border border-tinta/15 px-1 py-1">
      <Flecha dir="izq" onClick={onMenos} disabled={menosOff} aria-label={`Menos ${nombre}`} />
      <div className="min-w-0 flex-1 text-center" aria-live="polite">
        <p className="text-xl leading-tight">{valor}</p>
        <p className="text-xs text-tinta/60">{etiqueta}</p>
      </div>
      <Flecha dir="der" onClick={onMas} disabled={masOff} aria-label={`Más ${nombre}`} />
    </div>
  );
}

export default function ReservaModal() {
  const supabase = createClient();
  const hoy = hoyAR();

  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState('buscar'); // buscar | sin-lugar | plano | datos | ok
  const [fecha, setFecha] = useState(() => primerDiaAbierto(hoyAR()));
  const [personas, setPersonas] = useState(2);
  const [hora, setHora] = useState('20:00');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  const [mismoDia, setMismoDia] = useState([]);
  const [otrosDias, setOtrosDias] = useState([]);
  const [cargandoOtros, setCargandoOtros] = useState(false);

  const [mesas, setMesas] = useState([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [errorPlano, setErrorPlano] = useState(false);
  const [mesaId, setMesaId] = useState('');

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reserva, setReserva] = useState(null);
  const [logueado, setLogueado] = useState(false);

  const panelRef = useRef(null);
  const cerrarRef = useRef(null);

  // Abrir desde el hero o el menú
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener(EVENTO_RESERVA, abrir);
    return () => window.removeEventListener(EVENTO_RESERVA, abrir);
  }, []);

  // Al abrir: si hay sesión iniciada, se completa el nombre con el del perfil y se avisa que la reserva suma puntos
  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelado) return;
      setLogueado(!!user);
      if (!user) return;
      const { data: perfil } = await supabase.from('users').select('nombre, apellido').eq('id', user.id).single();
      if (cancelado || !perfil) return;
      const completo = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ');
      setNombre((actual) => actual || completo);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // Modal abierto: bloquea el scroll, atrapa el foco, cierra con Escape y devuelve el foco al cerrar
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement;
    document.body.style.overflow = 'hidden';
    cerrarRef.current?.focus();

    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = [...panelRef.current.querySelectorAll('button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      const primero = f[0];
      const ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', alTeclear);
      previo?.focus?.();
    };
  }, [abierto]);

  // Al cerrar después de confirmar, el modal vuelve a empezar
  useEffect(() => {
    if (!abierto && paso === 'ok') reiniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  function reiniciar() {
    setPaso('buscar');
    setMesaId('');
    setNombre('');
    setTelefono('');
    setReserva(null);
    setError('');
  }

  async function buscar() {
    setError('');
    setBuscando(true);
    const { data, error } = await supabase.rpc('horarios_disponibles', { p_fecha: fecha, p_personas: personas });
    if (error) {
      setBuscando(false);
      return setError('No pudimos consultar la disponibilidad. Probá de nuevo en un momento.');
    }
    const turno = (data ?? []).find((s) => formatHora(s.hora) === hora);
    if (turno?.disponible) {
      setBuscando(false);
      return entrarAlPlano(fecha, hora);
    }
    setMismoDia((data ?? []).filter((s) => s.disponible).map((s) => formatHora(s.hora)));
    setPaso('sin-lugar');
    setBuscando(false);
    buscarOtrosDias();
  }

  // Disponibilidad de los próximos días (los más cercanos al horario pedido)
  async function buscarOtrosDias() {
    setCargandoOtros(true);
    setOtrosDias([]);
    const fechas = [];
    for (let i = 1; fechas.length < DIAS_ALTERNATIVOS && i <= 14; i++) {
      const f = sumarDias(fecha, i);
      if (!DIAS_CERRADOS.includes(diaSemana(f))) fechas.push(f);
    }
    const resultados = await Promise.all(
      fechas.map(async (f) => {
        const { data } = await supabase.rpc('horarios_disponibles', { p_fecha: f, p_personas: personas });
        const libres = (data ?? []).filter((s) => s.disponible).map((s) => formatHora(s.hora));
        const cerca = (h) => Math.abs(aMinutos(h) - aMinutos(hora));
        const horas = [...libres].sort((a, b) => cerca(a) - cerca(b)).slice(0, 5).sort();
        return { fecha: f, horas };
      })
    );
    setOtrosDias(resultados.filter((r) => r.horas.length > 0));
    setCargandoOtros(false);
  }

  function entrarAlPlano(f, h) {
    setFecha(f);
    setHora(h);
    setMesaId('');
    setError('');
    setPaso('plano');
    cargarMesas(f, h);
  }

  async function cargarMesas(f, h) {
    setCargandoMesas(true);
    setErrorPlano(false);
    const { data, error } = await supabase.rpc('mesas_disponibilidad', { p_fecha: f, p_hora: h, p_personas: personas });
    setCargandoMesas(false);
    if (error) {
      setMesas([]);
      return setErrorPlano(true);
    }
    setMesas(data ?? []);
    // Si la mesa elegida dejó de estar libre (o no corresponde al grupo), se deselecciona
    setMesaId((actual) => {
      const m = (data ?? []).find((x) => x.id === actual);
      return m && m.libre && m.capacidad >= personas && m.capacidad <= capacidadMaxima(personas) ? actual : '';
    });
  }

  async function enviar(e) {
    e.preventDefault();
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
      // Si alguien tomó la mesa mientras tanto, se vuelve al plano con los datos actualizados
      if (/mesa|disponible/i.test(error.message)) {
        setPaso('plano');
        cargarMesas(fecha, hora);
      }
      return;
    }
    setReserva({ nombre, fecha, hora, personas, mesa: mesas.find((m) => m.id === mesaId)?.numero_mesa ?? null, conPuntos: logueado });
    setPaso('ok');
  }

  function atras() {
    setError('');
    setPaso(paso === 'datos' ? 'plano' : 'buscar');
  }

  if (!abierto) return null;

  const mesaElegida = mesas.find((m) => m.id === mesaId);
  const textoPersonas = `${personas} ${personas === 1 ? 'persona' : 'personas'}`;
  const resumen = `${formatFecha(fecha)} · ${textoPersonas} · ${hora}${mesaElegida && paso === 'datos' ? ` · Mesa ${mesaElegida.numero_mesa}` : ''}`;
  const idxHora = HORARIOS.indexOf(hora);

  // Se dibuja en <body> con un portal: en la landing el modal vive dentro de un contenedor "isolate"
  // (stacking context) y por eso quedaba por debajo del navbar, que seguía recibiendo clics.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="reserva-fade absolute inset-0 bg-black/70" onClick={() => setAbierto(false)} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserva-titulo"
        className="reserva-pop relative flex h-[100dvh] w-full flex-col bg-white text-tinta sm:h-auto sm:max-h-[92dvh] sm:max-w-[600px]"
      >
        <div className="mx-5 mt-3 flex shrink-0 items-center justify-between border-b border-tinta pb-2">
          <h2 id="reserva-titulo" className="text-sm font-medium">Reserva de mesa</h2>
          <button ref={cerrarRef} type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-tinta/10">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>

        {/* Resumen de lo elegido, con volver (pasos 2 en adelante) */}
        {(paso === 'sin-lugar' || paso === 'plano' || paso === 'datos') && (
          <div className="mx-5 mt-4 flex shrink-0 items-center gap-2 bg-tinta px-2 py-2.5 text-white">
            <button type="button" onClick={atras} aria-label="Volver" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <p className="flex-1 pr-8 text-center text-sm capitalize">{resumen}</p>
          </div>
        )}

        <div key={paso} className="reserva-paso min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3">
          {/* 1. Calendario, personas y horario */}
          {paso === 'buscar' && (
            <>
              {/* Encabezado con imagen: solo en pantallas medianas en adelante y bajo (en celular el espacio es para los controles) */}
              <div className="relative mb-3 hidden h-16 overflow-hidden sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/hero-desktop.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover object-[50%_35%]" />
                <div className="absolute inset-0 bg-black/55" />
                <p className={`${firma.className} absolute inset-0 flex items-center justify-center text-5xl text-white`}>{RESTAURANTE.nombre}</p>
              </div>

              <CalendarioReserva fecha={fecha} onSelect={setFecha} hoy={hoy} diasCerrados={DIAS_CERRADOS} />

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Selector
                  nombre="personas"
                  valor={personas}
                  etiqueta={personas === 1 ? 'Persona' : 'Personas'}
                  onMenos={() => setPersonas((p) => Math.max(1, p - 1))}
                  onMas={() => setPersonas((p) => Math.min(MAX_PERSONAS, p + 1))}
                  menosOff={personas <= 1}
                  masOff={personas >= MAX_PERSONAS}
                />
                <Selector
                  nombre="horario"
                  valor={hora}
                  etiqueta={aMinutos(hora) < 15 * 60 ? 'Almuerzo' : 'Cena'}
                  onMenos={() => setHora(HORARIOS[idxHora - 1])}
                  onMas={() => setHora(HORARIOS[idxHora + 1])}
                  menosOff={idxHora <= 0}
                  masOff={idxHora >= HORARIOS.length - 1}
                />
              </div>

              <p className="mt-3 text-center text-xs text-tinta/60">
                Para grupos de más de {MAX_PERSONAS} personas escribinos a {RESTAURANTE.email} o llamanos al {RESTAURANTE.telefono}.
              </p>
            </>
          )}

          {/* 2. Sin lugar: alternativas */}
          {paso === 'sin-lugar' && (
            <>
              <p className="bg-tinta/[0.06] px-4 py-5 text-center">
                Lamentablemente no hay mesas disponibles en el horario elegido.
              </p>

              {mismoDia.length > 0 && (
                <section className="mt-5">
                  <h3 className="mb-2 text-lg capitalize">Otros horarios el {formatFecha(fecha)}</h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {mismoDia.map((h) => (
                      <button key={h} type="button" onClick={() => entrarAlPlano(fecha, h)} className="rounded-md bg-tinta py-2.5 text-center text-white hover:bg-black">
                        {h}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-6">
                <h3 className="mb-1 text-lg">Otros días con disponibilidad</h3>
                {cargandoOtros ? (
                  <p className="py-4 text-sm text-tinta/60">Buscando en los próximos días…</p>
                ) : otrosDias.length === 0 ? (
                  <p className="py-4 text-sm text-tinta/60">
                    No encontramos lugar en los próximos días para {textoPersonas}. Probá con otra cantidad de personas o escribinos a {RESTAURANTE.email}.
                  </p>
                ) : (
                  otrosDias.map((d) => (
                    <div key={d.fecha} className="border-b border-tinta/10 py-3">
                      <p className="mb-2 capitalize text-tinta/80">{formatFecha(d.fecha)}</p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {d.horas.map((h) => (
                          <button key={h} type="button" onClick={() => entrarAlPlano(d.fecha, h)} className="rounded-md bg-tinta py-2.5 text-center text-white hover:bg-black">
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </section>
            </>
          )}

          {/* 3. Plano de mesas */}
          {paso === 'plano' && (
            <>
              <h3 className="mb-1 text-lg">Elegí tu mesa</h3>
              <p className="mb-3 text-sm text-tinta/70">Tocá una mesa libre del plano, o seguí y te asignamos la mejor.</p>

              {error && <p role="alert" className="mb-3 rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

              {cargandoMesas && mesas.length === 0 ? (
                <p className="py-10 text-center text-sm text-tinta/60">Dibujando el salón…</p>
              ) : errorPlano || mesas.length === 0 ? (
                <p className="rounded-md bg-sifon p-3 text-sm">
                  No pudimos mostrar el plano, pero igual podés reservar y te asignamos la mejor mesa libre.
                </p>
              ) : (
                <PlanoMesas mesas={mesas} personas={personas} seleccionada={mesaId} onSelect={setMesaId} />
              )}

              <div className="mt-3 flex items-center justify-between gap-3" aria-live="polite">
                <p className="text-sm">
                  {mesaElegida ? `Elegiste la mesa ${mesaElegida.numero_mesa}.` : 'Todavía no elegiste mesa.'}
                </p>
                {mesaElegida && (
                  <button type="button" onClick={() => setMesaId('')} className="text-xs underline underline-offset-2 hover:text-tomate">
                    Que la asignen ustedes
                  </button>
                )}
              </div>

              <button type="button" onClick={() => { setError(''); setPaso('datos'); }} className="btn btn-dark mt-4 w-full py-3 text-base">
                Continuar
              </button>
            </>
          )}

          {/* 4. Datos de contacto */}
          {paso === 'datos' && (
            <form onSubmit={enviar} className="space-y-4">
              <h3 className="text-lg">Tus datos</h3>
              <div>
                <label htmlFor="rm-nombre" className="label">Nombre</label>
                <input id="rm-nombre" required minLength={2} maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" autoComplete="name" />
              </div>
              <div>
                <label htmlFor="rm-telefono" className="label">Teléfono</label>
                <input id="rm-telefono" type="tel" required minLength={6} maxLength={30} pattern="[0-9+\(\)\s.\-]{6,30}" title="Solo números, espacios y + ( ) -" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input" autoComplete="tel" placeholder="11 5555 0123" />
              </div>
              <p className="text-sm text-tinta/70">
                {mesaElegida ? `Mesa ${mesaElegida.numero_mesa}, elegida por vos.` : 'Te asignamos la mejor mesa libre.'} Tu reserva se confirma automáticamente.
              </p>

              {logueado ? (
                <p className="rounded-md bg-sifon p-3 text-sm">Con tu cuenta sumás {PUNTOS_POR_RESERVA} puntos por esta reserva.</p>
              ) : (
                <p className="text-sm text-tinta/70">
                  ¿Querés sumar {PUNTOS_POR_RESERVA} puntos? <Link href="/login" className="underline underline-offset-2 hover:text-tomate">Ingresá</Link> o{' '}
                  <Link href="/login?modo=registro" className="underline underline-offset-2 hover:text-tomate">creá tu cuenta</Link> antes de reservar.
                </p>
              )}

              {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

<<<<<<< HEAD
              <button type="submit" disabled={enviando} className="btn btn-dark w-full py-3 text-base">
=======
              <button type="submit" disabled={enviando} className="btn btn-primary w-full py-3 text-base">
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f
                {enviando ? 'Reservando…' : 'Confirmar reserva'}
              </button>
            </form>
          )}

          {/* 5. Confirmación */}
          {paso === 'ok' && reserva && (
            <div className="py-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sifon">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <h3 className="mt-4 font-display text-3xl">¡Tu reserva está confirmada, {reserva.nombre.split(' ')[0]}!</h3>
              <p className="mt-3 capitalize text-tinta/80">
                {formatFecha(reserva.fecha)} · {reserva.hora} hs
              </p>
              <p className="text-tinta/80">
                {reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'}
                {reserva.mesa ? `, mesa ${reserva.mesa}` : ''}
              </p>
              <p className="mx-auto mt-4 max-w-sm text-sm text-tinta/70">
                Si necesitamos algo, te llamamos al teléfono que dejaste.
              </p>
              {reserva.conPuntos ? (
                <p className="mx-auto mt-4 max-w-sm rounded-md bg-sifon p-3 text-sm">
                  ¡Sumaste {PUNTOS_POR_RESERVA} puntos! Los ves en <Link href="/perfil" className="underline underline-offset-2">tu perfil</Link>.
                </p>
              ) : (
                <p className="mx-auto mt-4 max-w-sm text-sm text-tinta/70">
                  <Link href="/login?modo=registro" className="underline underline-offset-2 hover:text-tomate">Creá tu cuenta</Link> y sumá {PUNTOS_POR_RESERVA} puntos en tus próximas reservas.
                </p>
              )}
              <button type="button" onClick={() => setAbierto(false)} className="btn btn-dark mt-6 px-8">Cerrar</button>
            </div>
          )}
        </div>

        {/* CTA del paso 1 siempre visible, fuera del área que scrollea (respeta la barra inferior del celular) */}
        {paso === 'buscar' && (
          <div className="shrink-0 border-t border-tinta/10 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {error && <p role="alert" className="mb-2 rounded-md bg-tomate/10 p-2.5 text-sm text-tomate">{error}</p>}
            <button type="button" onClick={buscar} disabled={buscando} className="btn btn-dark w-full py-3 text-base">
              {buscando ? 'Buscando mesas…' : 'Buscar mesas'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}