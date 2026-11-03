import { RESTAURANTE } from '@/lib/config';
import Reveal from './Reveal';

// Título a la izquierda (alineado con el logo del navbar) y texto a la derecha,
// con el primer párrafo destacado. Sin fondo propio: usa el velo continuo de la landing.
export default function Historia() {
  const [intro, ...resto] = RESTAURANTE.historia;
  return (
    <section id="historia" className="scroll-mt-20 py-24 text-white md:py-36">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-6 md:px-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55">Quiénes somos</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">Nuestra historia</h2>
        </Reveal>
        <Reveal className="lg:col-span-7 lg:pt-9" delay={150}>
          <p className="max-w-2xl text-2xl leading-snug md:text-3xl">{intro}</p>
          <div className="mt-8 max-w-2xl space-y-5 text-lg text-white/75">
            {resto.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}