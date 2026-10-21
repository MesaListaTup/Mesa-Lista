import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Menu from '@/components/landing/Menu';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Menu />
      </main>
      <Footer />
    </>
  );
}
