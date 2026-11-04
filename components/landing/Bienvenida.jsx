import { RESTAURANTE } from '@/lib/config';
import Reveal from './Reveal';

// Recibimiento: título chico en mayúsculas y dos columnas de texto. Misma grilla que Historia: el primer texto
// arranca en el borde izquierdo (alineado con los títulos) y el segundo en la columna donde empieza el texto de Historia.
// El texto sale de RESTAURANTE.bienvenida (lib/config.js).
export default function Bienvenida() {
  const [primero, segundo] = RESTAURANTE.bienvenida;
  return (
    <section id="bienvenida" className="scroll-mt-20 pb-14 pt-20 text-white md:pb-16 md:pt-28">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-6 md:px-14 lg:grid-cols-12 lg:gap-x-16">
        <Reveal className="lg:col-span-12">
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.3em]">Bienvenidos a {RESTAURANTE.nombre}</h2>
        </Reveal>
        <Reveal className="lg:col-span-5" delay={100}>
          <p className="text-base leading-relaxed text-white/75 md:text-[17px]">{primero}</p>
        </Reveal>
        {segundo && (
          <Reveal className="lg:col-span-5 lg:col-start-6" delay={200}>
            <p className="text-base leading-relaxed text-white/75 md:text-[17px]">{segundo}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}