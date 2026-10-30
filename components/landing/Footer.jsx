import Link from 'next/link';
import { RESTAURANTE, SISTEMA, DEMO } from '@/lib/config';

// variante: 'demo' (restaurante de ejemplo) | 'sistema' (página del software)
export default function Footer({ variante = 'demo' }) {
  if (variante === 'sistema') {
    return (
      <footer className="bg-tinta text-papel">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-12 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-3xl">{SISTEMA.nombre}</p>
            <p className="mt-2 text-sm text-papel/70">{SISTEMA.eslogan}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="btn btn-ghost btn-sm">Ver la demo</Link>
            <a href={`mailto:${SISTEMA.email}`} className="btn btn-primary btn-sm">{SISTEMA.email}</a>
          </div>
        </div>
        <p className="border-t border-papel/15 py-4 text-center text-xs text-papel/50">
          {SISTEMA.nombre} · Proyecto final · {new Date().getFullYear()}
        </p>
      </footer>
    );
  }

  return (
    <footer className="bg-tinta text-papel">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">{RESTAURANTE.nombre}</p>
          <p className="mt-3 text-sm text-papel/70">Reservá online y llegá con tu mesa ya puesta.</p>
        </div>
        <div>
          <h3 className="font-display text-xl">Dónde estamos</h3>
          <p className="mt-3 text-sm text-papel/80">
            {RESTAURANTE.direccion}
            <br />
            {RESTAURANTE.ciudad}
          </p>
          <p className="mt-3 text-sm text-papel/80">
            {RESTAURANTE.telefono}
            <br />
            {RESTAURANTE.email}
          </p>
        </div>
        <div>
          <h3 className="font-display text-xl">Horarios</h3>
          <ul className="mt-3 space-y-1 text-sm text-papel/80">
            {RESTAURANTE.horarios.map((h) => (
              <li key={h.turno}>
                {h.turno}: {h.horas}
              </li>
            ))}
            <li>{RESTAURANTE.horarios[0].dias}. {RESTAURANTE.cerrado}.</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-papel/15 px-5 py-4 text-center text-xs text-papel/60">
        {DEMO ? (
          <>
            Sitio de demostración: los datos del restaurante son de ejemplo. Reservas y pedidos con{' '}
            <strong>{SISTEMA.nombre}</strong> ·{' '}
            <Link href="/sistema" className="underline underline-offset-2 hover:text-papel">Conocé el sistema</Link>
          </>
        ) : (
          <>Reservas con {SISTEMA.nombre}</>
        )}
      </p>
    </footer>
  );
}
