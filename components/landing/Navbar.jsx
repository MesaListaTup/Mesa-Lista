import { createClient } from '@/lib/supabase/server';
import { RESTAURANTE, SISTEMA } from '@/lib/config';
import DemoBar from '@/components/DemoBar';
import NavbarLinks from './NavbarLinks';

const LINKS_DEMO = [
  { href: '/#menu', label: 'Menú' },
  { href: '/#historia', label: 'Nuestra historia' },
  { href: '/#visitanos', label: 'Dónde encontrarnos' },
  { href: '/#contacto', label: 'Contacto' },
];

const LINKS_SISTEMA = [
  { href: '/sistema#incluye', label: 'Qué incluye' },
  { href: '/sistema#como', label: 'Cómo funciona' },
  { href: '/sistema#planes', label: 'Planes' },
  { href: '/sistema#contacto', label: 'Contacto' },
  { href: '/', label: 'Ver la demo' },
];

// variante: 'demo' (página del restaurante de ejemplo) | 'sistema' (página del software)
export default async function Navbar({ variante = 'demo' }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let esStaff = false;
  if (user) {
    const { data: perfil } = await supabase.from('users').select('rol').eq('id', user.id).single();
    esStaff = ['admin', 'staff'].includes(perfil?.rol);
  }

  const esSistema = variante === 'sistema';

  return (
    <header className="sticky top-0 z-20 border-b border-tinta/10 bg-papel/95 backdrop-blur">
      {!esSistema && <DemoBar />}
      <NavbarLinks
        marca={esSistema ? SISTEMA.nombre : RESTAURANTE.nombre}
        marcaHref={esSistema ? '/sistema' : '/'}
        links={esSistema ? LINKS_SISTEMA : LINKS_DEMO}
        estado={esStaff ? 'staff' : user ? 'cliente' : 'anon'}
      />
    </header>
  );
}
