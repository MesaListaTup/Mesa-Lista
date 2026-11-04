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

// Arma el link de WhatsApp a partir del teléfono cargado por el cliente (formato libre, ej. "11 5555 0123").
// Normaliza a formato internacional argentino para celulares: 54 9 + código de área + número (sin 0 ni 15).
export function linkWhatsApp(telefono) {
  let d = String(telefono ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (!d) return null;
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  d = d.replace(/^0+/, '');
  // Quita el "15" de celular que va después del código de área (código de 2 a 4 dígitos + 15 + abonado = 12 dígitos)
  if (d.length === 12) {
    for (const a of [2, 3, 4]) {
      if (d.slice(a, a + 2) === '15') {
        d = d.slice(0, a) + d.slice(a + 2);
        break;
      }
    }
  }
  if (d.length === 10) d = `549${d}`;
  else if (d.length < 10) return null;
  return `https://wa.me/${d}`;
}