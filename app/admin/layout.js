import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/admin/Sidebar';
<<<<<<< HEAD
import { hoyAR, inicioDiaAR } from '@/lib/utils';
=======
import { hoyAR } from '@/lib/utils';
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f
import { puedeVerPanel } from '@/lib/roles';

export const metadata = { title: 'Panel · Mesa Lista' };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase.from('users').select('nombre,email,rol').eq('id', user.id).single();

  if (!perfil || !puedeVerPanel(perfil.rol)) {
    return (
      <main className="panel-theme flex min-h-screen items-center justify-center bg-papel px-5">
        <div className="max-w-md rounded-lg border border-tinta/10 bg-white p-8 text-center">
          <h1 className="font-display text-3xl">Esta cuenta no tiene acceso al panel</h1>
          <p className="mt-3 text-sm text-tinta/70">
            El panel es solo para administradores. Si creés que es un error, pedile a un administrador que revise tu rol.
          </p>
          <Link href="/" className="btn btn-dark mt-6">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  // Contadores para los avisos del menú lateral. Si una consulta falla, simplemente no se muestra el aviso.
<<<<<<< HEAD
  const [reservasPend, mensajesNuevos, pedidosCocina] = await Promise.all([
=======
  const [reservasPend, mensajesNuevos] = await Promise.all([
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f
    supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente')
      .gte('fecha_reserva', hoyAR()),
    supabase.from('mensajes_contacto').select('id', { count: 'exact', head: true }).eq('leido', false),
<<<<<<< HEAD
    // Pedidos de hoy que Cocina todavía no empezó a preparar
    supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente').gte('created_at', inicioDiaAR()),
  ]);
  const contadores = { reservas: reservasPend.count ?? 0, mensajes: mensajesNuevos.count ?? 0, cocina: pedidosCocina.count ?? 0 };
=======
  ]);
  const contadores = { reservas: reservasPend.count ?? 0, mensajes: mensajesNuevos.count ?? 0 };
>>>>>>> 5c12805b45d06dbdb1ad7a33df1e309a185a3c8f

  return (
    <div className="panel-theme min-h-screen bg-papel text-tinta md:flex">
      <Sidebar perfil={perfil} contadores={contadores} />
      <main className="min-w-0 flex-1 p-5 md:p-10">{children}</main>
    </div>
  );
}