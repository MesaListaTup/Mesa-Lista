import Navbar from '@/components/landing/Navbar';
import FondoFijo from '@/components/landing/FondoFijo';
import Menu from '@/components/landing/Menu';
import ReservaModal from '@/components/landing/ReservaModal';
import Footer from '@/components/landing/Footer';

export const metadata = {
  title: 'Menú · Mesa Lista',
  description: 'La carta de Mesa Lista: platos, cafetería y bebidas.',
};

export default function PaginaMenu() {
  return (
    <>
      <Navbar />
      <div className="relative isolate">
        {/* Cuando esté la foto de la carta: <FondoFijo mobile="/img/menu-mobile.jpg" desktop="/img/menu-desktop.jpg" /> */}
        <FondoFijo />
        <main className="min-h-screen bg-black/60 pt-28 text-white md:pt-36">
          <Menu />
        </main>
        <Footer />
      </div>
      {/* El botón "Reservas" del menú de navegación abre este modal */}
      <ReservaModal />
    </>
  );
}