import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Menu from '@/components/landing/Menu';
import Historia from '@/components/landing/Historia';
import Ubicacion from '@/components/landing/Ubicacion';
import Contacto from '@/components/landing/Contacto';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Menu />
        <Historia />
        <Ubicacion />
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
