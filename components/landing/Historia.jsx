import { RESTAURANTE } from '@/lib/config';

export default function Historia() {
  return (
    <section id="historia" className="border-y border-tinta/10 bg-sifon/40">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="font-display text-4xl sm:text-5xl">Nuestra historia</h2>
        <div className="mt-6 space-y-4 text-lg text-tinta/80">
          {RESTAURANTE.historia.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
