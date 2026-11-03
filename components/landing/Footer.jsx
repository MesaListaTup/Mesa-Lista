import Link from 'next/link';
import { RESTAURANTE } from '@/lib/config';

const etiqueta = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';

// Cierra la página con el mismo velo oscuro (un poco más cerrado), así el final no corta con la foto fija.
export default function Footer() {
  return (
    <footer className="bg-black/80 text-white">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-16 md:grid-cols-3 md:px-14">
        <div>
          <p className="font-display text-3xl">{RESTAURANTE.nombre}</p>
          <p className="mt-3 max-w-xs text-sm text-white/70">Reservas online para que llegues y tu mesa ya esté puesta.</p>
        </div>
        <div>
          <h3 className={etiqueta}>Dónde estamos</h3>
          <p className="mt-3 text-sm text-white/80">
            {RESTAURANTE.direccion}
            <br />
            {RESTAURANTE.ciudad}
          </p>
          <p className="mt-3 text-sm text-white/80">
            {RESTAURANTE.telefono}
            <br />
            {RESTAURANTE.email}
          </p>
        </div>
        <div>
          <h3 className={etiqueta}>Horarios</h3>
          <ul className="mt-3 space-y-1 text-sm text-white/80">
            {RESTAURANTE.horarios.map((h) => (
              <li key={h.turno}>
                {h.turno}: {h.horas}
              </li>
            ))}
            <li>{RESTAURANTE.horarios[0].dias}. {RESTAURANTE.cerrado}.</li>
          </ul>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-white/45">
        <Link
          href="/desarrolladores"
          title="Conocé al equipo de desarrollo"
          className="underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Proyecto final · {new Date().getFullYear()}
        </Link>
      </p>
    </footer>
  );
}