import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RESTAURANTE } from '@/lib/config';
import NavbarLinks from './NavbarLinks';

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
        <NavbarLinks estado={esStaff ? 'staff' : user ? 'cliente' : 'anon'} />
      </nav>
    </header>
  );
}
