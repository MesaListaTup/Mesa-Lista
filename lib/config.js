// Datos del restaurante: editá acá y se actualiza toda la landing.
export const RESTAURANTE = {
  nombre: 'Mesa Lista',
  direccion: 'París 532',
  ciudad: 'Haedo, Buenos Aires',
  telefono: '+54 1139537244',
  email: 'mesalistaresto@gmail.com',
  horarios: [
    { dias: 'Martes a domingo', turno: 'Almuerzo', horas: '12:00 a 15:00' },
    { dias: 'Martes a domingo', turno: 'Cena', horas: '20:00 a 23:30' },
  ],
  cerrado: 'Lunes cerrado',
  // Mapa de Google (sin API key): se arma con la dirección. Cambiá el texto si querés otro punto.
  mapaQuery: 'París 532, B1706EAH Haedo, Provincia de Buenos Aires',
  historia: [
    'Mesa Lista nació de una idea simple: que llegar a comer no empiece con una espera. Empezamos como una cocina de barrio con cuatro mesas y una carta corta.',
    'Con los años la carta creció, pero la idea sigue igual: producto fresco, platos de bodegón y una mesa que ya está puesta cuando llegás.',
  ],
};
