// MESA LISTA es el SISTEMA (el software que se vende). El restaurante que se ve en la landing es solo una DEMO.
export const SISTEMA = {
  nombre: 'Mesa Lista',
  eslogan: 'El sistema de reservas y pedidos para restaurantes',
  email: 'mesalistaresto@gmail.com',
};

// Mientras sea true, la landing muestra el cartel "Sitio de demostración".
// Cuando un local contrate el sistema, se pone en false y se completan sus datos reales.
export const DEMO = true;

// Reglas de mesas (tienen que coincidir con mesa_acepta() de supabase/v4_reglas_mesas.sql)
export const REGLA_MESA = { menos: 2, mas: 2 };     // una mesa acepta de (capacidad - 2) a (capacidad + 2) personas
export const DURACION_RESERVA_HORAS = 2;            // sin sobremesa: a las 2 horas la mesa se libera

// Datos del restaurante DEMO: editá acá y se actualiza toda la landing.
export const RESTAURANTE = {
  nombre: 'Bodegón La Esquina',
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
    'La Esquina nació de una idea simple: que llegar a comer no empiece con una espera. Empezamos como una cocina de barrio con cuatro mesas y una carta corta.',
    'Con los años la carta creció, pero la idea sigue igual: producto fresco, platos de bodegón y una mesa que ya está puesta cuando llegás.',
  ],
};
