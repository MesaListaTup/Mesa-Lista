// Los códigos se guardan sin guion (8 caracteres) y se muestran como XXXX-XXXX
export function formatCodigo(codigo = '') {
  return codigo.length === 8 ? `${codigo.slice(0, 4)}-${codigo.slice(4)}` : codigo;
}

// Fecha y hora en Argentina, para mostrar cuándo se canjeó o se usó un cupón
export function fechaHoraAR(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
