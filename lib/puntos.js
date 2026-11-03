// Puntos que suma cada reserva. Solo sirve para mostrar el texto en la web:
// el valor real lo define la base de datos (supabase/v4_perfil_puntos.sql, c_puntos_por_reserva).
// Si lo cambiás, cambialo en los dos lados.
export const PUNTOS_POR_RESERVA = 100;


// Video tutorial de la sección Beneficios. Subí el archivo a public/video/ y poné acá su ruta.
// Mientras esté vacío, la página muestra solo el paso a paso ilustrado (sin reproductor).
//   ej.: export const TUTORIAL_PUNTOS = { video: '/video/tutorial-puntos.mp4', poster: '/video/tutorial-puntos.jpg' };
export const TUTORIAL_PUNTOS = {
  youtube: 'https://www.youtube.com/watch?v=CnWxXS7ZWsg',
  video: '/video/tutorial-puntos.mp4',
  poster: '/video/tutorial-puntos.jpg',
};