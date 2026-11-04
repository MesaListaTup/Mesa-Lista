import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import DesarrolladoresClient from './DesarrolladoresClient';

export default async function DesarrolladoresPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('desarrolladores')
    .select('id,nombre,descripcion,foto_url,foto_path,orden')
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Desarrolladores</h1>
          <p className="mt-2 max-w-xl text-sm text-tinta/70">
            Estos datos y fotos se muestran en la página pública del equipo, a la que se llega desde el pie de página.
          </p>
        </div>
        <Link href="/desarrolladores" target="_blank" className="btn btn-ghost btn-sm">Ver página pública</Link>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-tomate/10 p-4 text-sm text-tomate">
          No se pudieron cargar los desarrolladores: {error.message}. Si falta la tabla, ejecutá
          supabase/v7_desarrolladores.sql en el SQL Editor de Supabase.
        </p>
      ) : (
        <DesarrolladoresClient desarrolladores={data ?? []} />
      )}
    </div>
  );
}
