import { RESTAURANTE } from '@/lib/config';
import Reveal from './Reveal';

// Quiénes somos: título e intro a la izquierda (alineado con el logo del navbar) y, a la derecha, un recorrido
// "Así empezamos → Así somos hoy" con línea de tiempo. Sin fondo propio: usa el velo continuo de la landing.
// El texto sale de RESTAURANTE.historia (lib/config.js).
//
// scroll-mt: al llegar desde el navbar (/#historia) la etiqueta "Quiénes somos" queda a la misma altura que
// el primer texto de las demás páginas (pt-28 en celular / pt-36 en escritorio, bajo el navbar fijo).
// Es el padding superior de la sección (py-24 / md:py-36) menos esa altura.
export default function Historia() {
  const { titulo, intro, etapas, propuesta } = RESTAURANTE.historia;
  return (
    <section id="historia" className="scroll-mt-4 py-24 text-white md:scroll-mt-0 md:py-36">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-6 md:px-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55">Quiénes somos</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">{titulo}</h2>
          <p className="mt-6 max-w-md text-xl leading-snug text-white/85 md:text-2xl">{intro}</p>
        </Reveal>

        <div className="lg:col-span-7 lg:pt-9">
          <ol className="relative ml-3 border-l border-white/20 pl-8 md:pl-10">
            {etapas.map((e, i) => (
              <li key={e.etiqueta} className="relative pb-10 last:pb-0">
                <Reveal delay={i * 120}>
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[41px] top-1.5 h-3 w-3 rounded-full border md:-left-[49px] ${i === etapas.length - 1 ? 'border-white bg-white' : 'border-white/60 bg-black'}`}
                  />
                  <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55">{e.etiqueta}</p>
                  <h3 className="mt-2 font-display text-2xl md:text-3xl">{e.titulo}</h3>
                  <p className="mt-3 max-w-2xl text-lg text-white/75">{e.texto}</p>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal delay={200} className="mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-lg text-white/85">{propuesta}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
