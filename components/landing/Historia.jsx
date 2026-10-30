import { RESTAURANTE } from '@/lib/config';
import Ilustracion from '@/components/ui/Ilustracion';

export default function Historia() {
  return (
    <section id="historia" className="border-y border-tinta/10 bg-sifon/40">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl">Nuestra historia</h2>
          <div className="mt-6 space-y-4 text-lg text-tinta/80">
            {RESTAURANTE.historia.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3" aria-hidden="true">
          {['pasta', 'parrilla', 'postre', 'cafe'].map((t) => (
            <div key={t} className="rounded-lg bg-white/70 p-3">
              <Ilustracion tipo={t} className="h-auto w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
