import Reveal from '@/components/landing/Reveal';
import { PUNTOS_POR_RESERVA, TUTORIAL_PUNTOS } from '@/lib/puntos';

const etiqueta = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';

// "Cómo funcionan los puntos": recorrido de la persona en 6 pasos y, si hay un video cargado
// (TUTORIAL_PUNTOS en lib/puntos.js), un reproductor al lado que lo muestra en pantalla.
export default function TutorialPuntos() {
  const pasos = [
    ['Hacé tu reserva', 'Reservá tu mesa online con tu cuenta.'],
    ['Se acreditan tus puntos', `Sumás ${PUNTOS_POR_RESERVA} puntos con cada reserva, directo en tu cuenta.`],
    ['Entrá a Beneficios', 'Acá ves tus puntos y todo lo que podés canjear.'],
    ['Elegí un beneficio', 'Fijate cuáles alcanzan con tus puntos y elegí el que más te guste.'],
    ['Canjeá y obtené tu cupón', 'Tus puntos se cambian por un cupón con su código.'],
    ['Usalo en el restaurante', 'Mostrale el código al mesero cuando estés en el local.'],
  ];
  const { video, poster } = TUTORIAL_PUNTOS;

  return (
    <section aria-labelledby="como-funciona" className="mt-10">
      <Reveal>
        <p className={etiqueta}>Cómo funciona</p>
        <h2 id="como-funciona" className="mt-3 font-display text-3xl leading-tight sm:text-4xl">Tus puntos, paso a paso</h2>
      </Reveal>

      <div className={`mt-6 grid gap-8 ${video ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start' : ''}`}>
        {video && (
          <Reveal delay={100}>
            <video
              controls
              playsInline
              preload="metadata"
              poster={poster || undefined}
              className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-cover"
              aria-label="Video: cómo funciona el sistema de puntos"
            >
              <source src={video} type="video/mp4" />
              Tu navegador no puede reproducir el video. Seguí los pasos de al lado.
            </video>
          </Reveal>
        )}

        <ol className={`grid gap-x-8 gap-y-5 ${video ? '' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {pasos.map(([titulo, texto], i) => (
            <li key={titulo}>
              <Reveal className="flex items-start gap-4" delay={i * 80}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 font-display text-base" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{titulo}</p>
                  <p className="mt-0.5 text-white/70">{texto}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
