import Navbar from '@/components/landing/Navbar';
import FondoFijo from '@/components/landing/FondoFijo';
import Hero from '@/components/landing/Hero';
import Bienvenida from '@/components/landing/Bienvenida';
import Galeria from '@/components/landing/Galeria';
import Historia from '@/components/landing/Historia';
import Ubicacion from '@/components/landing/Ubicacion';
import Contacto from '@/components/landing/Contacto';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      {/* La foto queda fija detrás; el contenido se desplaza por encima */}
      <div className="relative isolate">
        <FondoFijo />
        <main>
          <Hero />
          {/* Un único velo continuo desde el final del hero hasta el footer: sin franjas ni cortes entre secciones */}
          <div className="bg-black/60">
            <Bienvenida />
            <Galeria />
            <Historia />
            <Ubicacion />
            <Contacto />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}