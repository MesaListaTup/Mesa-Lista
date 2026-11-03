import { createClient } from '@/lib/supabase/server';
import { RESTAURANTE } from '@/lib/config';
import NavbarClient from './NavbarClient';

// Parte de servidor: averigua si hay sesión y qué rol tiene. El dibujo y la interacción están en NavbarClient.
export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let estado = 'anonimo';
  if (user) {
    const { data: perfil } = await supabase.from('users').select('rol').eq('id', user.id).single();
    estado = ['admin', 'staff'].includes(perfil?.rol) ? 'staff' : 'cliente';
  }

  return <NavbarClient estado={estado} nombre={RESTAURANTE.nombre} />;
}
