import { RESTAURANTE } from '@/lib/config';

export default function Ubicacion() {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(RESTAURANTE.mapaQuery)}&output=embed`;
  return (
    <section id="visitanos" className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="font-display text-4xl sm:text-5xl">Dónde encontrarnos</h2>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5 text-tinta/80">
          <p>
            {RESTAURANTE.direccion}
            <br />
            {RESTAURANTE.ciudad}
          </p>
          <ul className="space-y-1 text-sm">
            {RESTAURANTE.horarios.map((h) => (
              <li key={h.turno}>
                <span className="font-semibold">{h.turno}:</span> {h.horas}
              </li>
            ))}
            <li>{RESTAURANTE.horarios[0].dias}. {RESTAURANTE.cerrado}.</li>
          </ul>
          <p className="text-sm">
            {RESTAURANTE.telefono}
            <br />
            {RESTAURANTE.email}
          </p>
        </div>
        <iframe
          title={`Mapa de ${RESTAURANTE.nombre}`}
          src={src}
          className="h-72 w-full rounded-lg border border-tinta/10 sm:h-96"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
