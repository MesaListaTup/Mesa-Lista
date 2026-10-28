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
