import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/admin/Sidebar';

export const metadata = { title: 'Panel · Mesa Lista' };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase.from('users').select('nombre,email,rol').eq('id', user.id).single();

  if (!perfil || !['admin', 'staff'].includes(perfil.rol)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-lg border border-tinta/10 bg-white p-8 text-center">
          <h1 className="font-display text-3xl">Esta cuenta no tiene acceso al panel</h1>
          <p className="mt-3 text-sm text-tinta/70">
            Pedile a un administrador que cambie tu rol a staff o admin, y volvé a ingresar.
          </p>
          <Link href="/" className="btn btn-dark mt-6">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  // Sin sobremesa: libera las mesas ocupadas hace más de 2 h y cierra las reservas vencidas.
  // Si todavía no se corrió supabase/v4_reglas_mesas.sql, la llamada falla y se ignora.
  await supabase.rpc('cerrar_vencidos');

  return (
    <div className="min-h-screen md:flex">
      <Sidebar perfil={perfil} />
      <main className="min-w-0 flex-1 p-5 md:p-10">{children}</main>
    </div>
  );
}
