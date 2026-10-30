import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import LoginForm from './LoginForm';

export const metadata = { title: 'Ingresar · Bodegón La Esquina (demo)' };

// Server component: mantiene el header y el footer de la landing y deja el formulario como componente de cliente
export default function LoginPage({ searchParams }) {
  const modoInicial = searchParams?.modo === 'registro' ? 'registro' : 'login';
  return (
    <>
      <Navbar />
      <main className="gingham flex min-h-[70vh] items-center justify-center px-5 py-12">
        <LoginForm modoInicial={modoInicial} />
      </main>
      <Footer />
    </>
  );
}
