import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/landing/Navbar';
import FondoFijo from '@/components/landing/FondoFijo';
import Footer from '@/components/landing/Footer';
import ReservaModal from '@/components/landing/ReservaModal';
import LoginForm from './LoginForm';

export const metadata = { title: 'Ingresar · Mesa Lista' };
export const dynamic = 'force-dynamic';

// Misma estructura que el resto de la web: foto fija de fondo, velo oscuro y el contenido por encima.
// /login?modo=registro abre directamente el formulario de registro.
export default async function LoginPage({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/perfil'); // si ya inició sesión no tiene sentido mostrarle el login

  return (
    <>
      <Navbar />
      <div className="relative isolate">
        <FondoFijo />
        <main className="flex min-h-screen items-center bg-black/60 px-6 pb-16 pt-28 text-white md:pt-32">
          <LoginForm modoInicial={searchParams?.modo === 'registro' ? 'registro' : 'login'} />
        </main>
        <Footer />
      </div>
      {/* El botón "Reservas" del menú de navegación abre este modal */}
      <ReservaModal />
    </>
  );
}