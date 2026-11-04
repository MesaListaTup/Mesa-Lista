import Navbar from '@/components/landing/Navbar';
import FondoFijo from '@/components/landing/FondoFijo';
import Equipo from '@/components/landing/Equipo';
import ReservaModal from '@/components/landing/ReservaModal';
import Footer from '@/components/landing/Footer';
import { RESTAURANTE } from '@/lib/config';

export const metadata = {
  title: `Equipo de desarrollo · ${RESTAURANTE.nombre}`,
  description: `Las personas que desarrollaron el sistema de ${RESTAURANTE.nombre}.`,
};

// Misma estructura que /menu: foto fija de fondo, velo oscuro y el contenido deslizándose por encima.
export default function PaginaDesarrolladores() {
  return (
    <>
      <Navbar />
      <div className="relative isolate">
        <FondoFijo />
        <main className="min-h-screen bg-black/60 pt-28 text-white md:pt-36">
          <Equipo />
        </main>
        <Footer />
      </div>
      {/* El botón "Reservas" del menú de navegación abre este modal */}
      <ReservaModal />
    </>
  );
}
