# Guía de imágenes del menú

## Cómo funciona
- Cada producto puede tener una **foto** (campo "Foto" en Admin > Productos, con el link a la imagen).
- Si no tiene foto, la carta muestra una **ilustración** propia según el tipo de plato (pasta, parrilla, milanesa, ensalada, tarta, postre, café, bebida, vino u otro). Por defecto se elige sola por el nombre; también se puede fijar a mano.
- Las ilustraciones están en `components/ui/dibujos.js` y todas comparten estilo (trazo azul tinta, formas planas, paleta de la marca).

## Dónde alojar las fotos
Lo más simple es **Supabase Storage**: crear un bucket público `menu`, subir las fotos y copiar el link público de cada una.

## Estilo para que todas las fotos se vean de la misma marca
- Vista cenital (de arriba) o a 45°, un solo plato por foto.
- Luz natural de ventana, sin flash.
- Fondo liso: mantel a cuadros azul y blanco, o mesa de madera clara.
- Platos blancos o de loza, sin logos.
- Formato **4:3 horizontal**, mínimo 1200×900 px, menos de 300 KB (comprimir con squoosh.app).
- Nombre del archivo: `pasta-donato.jpg`, `parrilla-mixta.jpg`, etc.

## Prompt base para generar o pedir las fotos
> Foto gastronómica cenital de [PLATO], servido en plato blanco de loza, sobre mantel a cuadros azul y blanco, luz natural suave de ventana, colores cálidos, estilo bodegón argentino, sin texto ni logos, formato horizontal 4:3.

Ejemplos de [PLATO]: "pasta Donato con salsa fileto y albahaca", "parrillada mixta con chorizo, morcilla y vacío", "milanesa napolitana con papas fritas", "flan casero con dulce de leche y crema".

Usar siempre el mismo prompt (cambiando solo el plato) para que la carta quede coherente. Si usan fotos de otras personas, verificar la licencia.
