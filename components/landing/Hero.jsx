import './hero.css';
import BotonReservas from './BotonReservas';
import ReservaModal from './ReservaModal';

// Hero a pantalla completa: la foto del bar es la capa fija (FondoFijo), navegación flotante (Navbar) y un único botón "Reservas".
// El botón abre el modal de reservas (calendario, personas, horario y plano de mesas).
export default function Hero() {
  return (
    <>
      <section id="inicio" className="relative h-[100svh] min-h-[560px] w-full text-white">
        <h1 className="sr-only">Mesa Lista, restaurante con reservas online</h1>

        {/* Velo oscuro para que la navegación y el botón se lean bien */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/60" />

        {/* Botón central */}
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <BotonReservas
            className="hero-fade-up border border-white/70 px-10 py-3.5 text-[13px] font-medium uppercase tracking-[0.4em] text-white transition-colors duration-500 hover:bg-white hover:text-black"
            style={{ animationDelay: '700ms' }}
          >
            <span className="-mr-[0.4em] block">Reservas</span>
          </BotonReservas>
        </div>

        {/* Línea fina inferior */}
        <div className="hero-line absolute inset-x-6 bottom-[10%] h-px bg-white/80 md:inset-x-[4.5%]" aria-hidden="true" />
      </section>

      <ReservaModal />
    </>
  );
}