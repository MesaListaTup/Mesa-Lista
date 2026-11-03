import './hero.css';

// Foto de fondo fija: se queda quieta y el contenido de la página se desplaza por encima.
// La usan la landing y /menu. Para darle otra foto a una página, pasale sus propias rutas.
// Va dentro de un contenedor "relative isolate" (ver app/page.js y app/menu/page.js).
export default function FondoFijo({ mobile = '/img/hero-mobile.jpg', desktop = '/img/hero-desktop.jpg' }) {
  return (
    <div className="fixed inset-x-0 top-0 -z-10 h-lvh w-full overflow-hidden bg-black" aria-hidden="true">
      {/* Vertical en celular, horizontal desde tablet */}
      <picture>
        <source media="(min-width: 768px)" srcSet={desktop} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobile}
          alt=""
          fetchPriority="high"
          className="hero-zoom h-full w-full object-cover object-[30%_50%] md:object-[50%_45%]"
        />
      </picture>
      {/* Velo leve y parejo; cada sección agrega el suyo para que el texto se lea */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
