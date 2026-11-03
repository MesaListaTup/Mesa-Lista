import { createClient } from '@/lib/supabase/server';
import { RESTAURANTE } from '@/lib/config';
import { puedeVerPanel } from '@/lib/roles';
import NavbarClient from './NavbarClient';

// Parte de servidor: averigua si hay sesión y si es admin (anonimo | cliente | admin). El dibujo y la interacción están en NavbarClient.
export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let estado = 'anonimo';
  if (user) {
    const { data: perfil } = await supabase.from('users').select('rol').eq('id', user.id).single();
    estado = puedeVerPanel(perfil?.rol) ? 'admin' : 'cliente';
  }

  return <NavbarClient estado={estado} nombre={RESTAURANTE.nombre} />;
}
