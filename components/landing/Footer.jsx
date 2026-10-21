import { RESTAURANTE } from '@/lib/config';

export default function Footer() {
  return (
    <footer id="visitanos" className="bg-tinta text-papel">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">{RESTAURANTE.nombre}</p>
          <p className="mt-3 text-sm text-papel/70">Reservas online para que llegues y tu mesa ya esté puesta.</p>
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
      <p className="border-t border-papel/15 py-4 text-center text-xs text-papel/50">
        Proyecto final · {new Date().getFullYear()}
      </p>
    </footer>
  );
}
