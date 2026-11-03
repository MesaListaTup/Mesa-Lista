// El hero y el menú de navegación abren el mismo modal de reservas mediante un evento del navegador.
export const EVENTO_RESERVA = 'mesalista:abrir-reserva';

export function abrirReserva() {
  window.dispatchEvent(new CustomEvent(EVENTO_RESERVA));
}
