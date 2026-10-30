import ReservaForm from './ReservaForm';
import { RESTAURANTE } from '@/lib/config';
import Ilustracion from '@/components/ui/Ilustracion';

export default function Hero() {
  return (
    <section className="gingham border-b border-tinta/10">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        <div className="rounded-lg bg-papel p-7 sm:p-10">
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Tu mesa ya está lista.
          </h1>
          <p className="mt-6 max-w-md text-lg text-tinta/80">
            Elegí el día, la cantidad de personas y un horario. Solo te mostramos los turnos que tienen mesa libre, y
            si querés, elegís en el plano de qué mesa te sentás.
          </p>
          <div className="mt-8 flex gap-3" aria-hidden="true">
            {['pasta', 'parrilla', 'postre'].map((t) => (
              <div key={t} className="w-20 rounded-lg bg-sifon/70 p-2 sm:w-24">
                <Ilustracion tipo={t} className="h-auto w-full" />
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-tinta/70">
            {RESTAURANTE.direccion}, {RESTAURANTE.ciudad}
            <br />
            {RESTAURANTE.horarios[0].dias}, almuerzo y cena. {RESTAURANTE.cerrado}.
          </p>
        </div>
        <ReservaForm />
      </div>
    </section>
  );
}
