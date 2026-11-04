import ReservaForm from './ReservaForm';
import { RESTAURANTE } from '@/lib/config';

// Sección con el formulario de reserva (antes estaba dentro del hero)
export default function ReservaSection() {
  return (
    <section id="reservas" className="bg-[#120e0b] text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Reservas</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">Tu mesa ya está lista.</h2>
          <p className="mt-6 max-w-md text-lg text-white/75">
            Elegí el día, la cantidad de personas y un horario. Solo te mostramos los turnos que tienen mesa libre, y si
            querés, elegís en el plano de qué mesa te sentás.
          </p>
          <p className="mt-8 text-sm text-white/55">
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
