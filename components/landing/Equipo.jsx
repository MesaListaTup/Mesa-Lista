import { createClient } from '@/lib/supabase/server';
import { FOTO_POR_DEFECTO } from '@/lib/desarrolladores';
import Reveal from './Reveal';

const ETIQUETA = 'Proyecto final';
const TITULO = 'Equipo de desarrollo';
const BAJADA =
  'Estudiantes de la Tecnicatura Universitaria en Programación de la UTN Facultad Regional Haedo. Desarrollamos este sistema de reservas y gestión como proyecto integrador.';

// Los datos y las fotos se editan desde el panel (sección Desarrolladores).
export default async function Equipo() {
  const supabase = createClient();
  const { data: desarrolladores } = await supabase
    .from('desarrolladores')
    .select('id,nombre,descripcion,foto_url')
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true });

  return (
    <section className="mx-auto max-w-[1600px] px-6 pb-24 md:px-14">
      <Reveal>
        <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55">{ETIQUETA}</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">{TITULO}</h1>
        <p className="mt-3 max-w-2xl text-white/75">{BAJADA}</p>
      </Reveal>

      {!desarrolladores?.length ? (
        <p className="mt-10 rounded-md bg-sifon p-4 text-sm text-tinta">Todavía no hay integrantes cargados.</p>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {desarrolladores.map((d, i) => (
            <li key={d.id}>
              <Reveal className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5" delay={i * 120}>
                <div className="aspect-[4/5] w-full overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.foto_url || FOTO_POR_DEFECTO}
                    alt={d.foto_url ? `Foto de ${d.nombre}` : ''}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="font-display text-2xl">{d.nombre}</h2>
                  {d.descripcion && <p className="mt-2 text-sm text-white/70">{d.descripcion}</p>}
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
