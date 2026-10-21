import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RESTAURANTE } from '@/lib/config';

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let esStaff = false;
  if (user) {
    const { data: perfil } = await supabase.from('users').select('rol').eq('id', user.id).single();
    esStaff = ['admin', 'staff'].includes(perfil?.rol);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-tinta/10 bg-papel/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="font-display text-2xl text-tinta">
          {RESTAURANTE.nombre}
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium">
          <a href="#menu" className="hidden hover:text-tomate sm:inline">Menú</a>
          <a href="#visitanos" className="hidden hover:text-tomate sm:inline">Cómo llegar</a>
          {esStaff ? (
            <Link href="/admin" className="btn btn-dark btn-sm">Ir al panel</Link>
          ) : user ? (
            <form action="/auth/signout" method="post">
              <button className="btn btn-ghost btn-sm">Cerrar sesión</button>
            </form>
          ) : (
            <Link href="/login" className="btn btn-ghost btn-sm">Ingresar</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
