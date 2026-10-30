import { REGLA_MESA } from './config';

const TZ = 'America/Argentina/Buenos_Aires';

// "YYYY-MM-DD" de hoy en Argentina
export function hoyAR() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TZ });
}

// Suma días a un "YYYY-MM-DD"
export function sumarDias(fechaISO, dias) {
  const d = new Date(`${fechaISO}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('sv-SE');
}

// Minutos desde medianoche, hora actual en Argentina
export function minutosAhoraAR() {
  const [h, m] = new Date()
    .toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
    .split(':')
    .map(Number);
  return h * 60 + m;
}

export function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function formatHora(hora) {
  return hora?.slice(0, 5) ?? '';
}

export function formatFecha(fechaISO) {
  if (!fechaISO) return '';
  return new Date(`${fechaISO}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatPrecio(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n ?? 0);
}

// Inicio del día de hoy (Argentina, UTC-3) como timestamp ISO
export function inicioDiaAR() {
  return `${hoyAR()}T00:00:00-03:00`;
}

// Hora "HH:MM" (Argentina) de un timestamp ISO
export function formatHoraTS(ts) {
  return new Date(ts).toLocaleTimeString('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
}

// "YYYY-MM-DD" (Argentina) de un timestamp ISO
export function fechaAR(ts) {
  return new Date(ts).toLocaleDateString('sv-SE', { timeZone: TZ });
}

// Una mesa acepta grupos de (capacidad - 2) a (capacidad + 2). Igual que mesa_acepta() en SQL.
export function mesaAcepta(capacidad, personas) {
  return personas >= Math.max(1, capacidad - REGLA_MESA.menos) && personas <= capacidad + REGLA_MESA.mas;
}

// Texto para mostrar el rango de una mesa, por ejemplo "2 a 6 personas"
export function rangoMesa(capacidad) {
  return `${Math.max(1, capacidad - REGLA_MESA.menos)} a ${capacidad + REGLA_MESA.mas} personas`;
}
