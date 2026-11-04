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
  // Texto de bienvenida (antes de la galería): dos párrafos, uno por columna. Reemplazalo por el tuyo.
  bienvenida: [
    'Mesa Lista abrió sus puertas en Haedo con una idea simple: una cocina de bodegón, producto fresco y una mesa que ya está puesta cuando llegás. Detrás de cada plato hay una cocina abierta, de puertas para adentro y de manos conocidas.',
    'Nuestra propuesta —platos de siempre, atención cercana y reservas online— se fue afinando con cada servicio y con cada persona que pasó por acá. Nos gusta que vengas a comer sin apuro, y que vuelvas.',
  ],
  // Galería: subí las 8 fotos a public/img con estos nombres (o cambiá las rutas y los textos alt acá).
  galeria: [
    { src: '/img/galeria-1.webp', alt: 'Mesa Lista, foto 1' },
    { src: '/img/galeria-2.webp', alt: 'Mesa Lista, foto 2' },
    { src: '/img/galeria-3.webp', alt: 'Mesa Lista, foto 3' },
    { src: '/img/galeria-4.webp', alt: 'Mesa Lista, foto 4' },
    { src: '/img/galeria-5.webp', alt: 'Mesa Lista, foto 5' },
    { src: '/img/galeria-6.webp', alt: 'Mesa Lista, foto 6' },
    { src: '/img/galeria-7.webp', alt: 'Mesa Lista, foto 7' },
    { src: '/img/galeria-8.webp', alt: 'Mesa Lista, foto 8' },
  ],
  // Historia ("Quiénes somos"): se muestra como un recorrido "Así empezamos → Así somos hoy".
  // Reemplazá los textos por la historia real del local (fechas, nombres, anécdotas): son solo editables acá.
  historia: {
    titulo: 'Así empezamos, así somos hoy',
    intro: 'Mesa Lista nació de una idea simple: que llegar a comer no empiece con una espera.',
    etapas: [
      {
        etiqueta: 'Así empezamos',
        titulo: 'Una cocina de barrio',
        texto: 'Arrancamos en Haedo con cuatro mesas y una carta corta. Cocina de bodegón, producto fresco y manos conocidas detrás de cada plato.',
      },
      {
        etiqueta: 'Fuimos creciendo',
        titulo: 'Con cada servicio',
        texto: 'La carta se amplió, el salón se llenó de caras conocidas y fuimos afinando lo que más nos importa: atención cercana y comer sin apuro.',
      },
      {
        etiqueta: 'Así somos hoy',
        titulo: 'La mesa ya está puesta',
        texto: 'Hoy podés reservar online, elegir tu mesa en el plano del salón y sumar puntos que se convierten en beneficios cada vez que volvés.',
      },
    ],
    propuesta: 'Nuestra propuesta: platos de siempre, atención cercana y una mesa que ya está puesta cuando llegás. Queremos que vengas, que te quedes un rato y que vuelvas.',
  },
};