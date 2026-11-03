import { createClient } from '@/lib/supabase/server';
import { formatPrecio } from '@/lib/utils';
import Reveal from './Reveal';

const CATEGORIAS = [
  { id: 'comida', titulo: 'Para comer' },
  { id: 'cafeteria', titulo: 'Cafetería' },
  { id: 'bebida', titulo: 'Para tomar' },
];

export default async function Menu() {
  const supabase = createClient();
  const { data: productos } = await supabase
    .from('productos')
    .select('id,nombre,descripcion,precio,categoria')
    .eq('disponible', true)
    .order('precio', { ascending: false });

  return (
    <section id="menu" className="mx-auto max-w-[1600px] px-6 pb-24 md:px-14">
      <Reveal>
        <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55">La carta</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">Lo que sale de la cocina</h1>
        <p className="mt-3 max-w-xl text-white/75">
          Cocina de bodegón con producto fresco. La carta se actualiza todos los días según lo que haya en el mercado.
        </p>
      </Reveal>

      {!productos?.length ? (
        <p className="mt-10 rounded-md bg-sifon p-4 text-sm text-tinta">La carta se está actualizando. Volvé en un rato.</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CATEGORIAS.map((cat, i) => {
            const items = productos.filter((p) => p.categoria === cat.id);
            if (!items.length) return null;
            return (
              <Reveal key={cat.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7" delay={i * 120}>
                <h3 className="border-b border-white/25 pb-3 font-display text-2xl">{cat.titulo}</h3>
                <ul className="mt-4 divide-y divide-white/15">
                  {items.map((p) => (
                    <li key={p.id} className="py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">{p.nombre}</span>
                        <span className="shrink-0 tabular-nums">{formatPrecio(p.precio)}</span>
                      </div>
                      {p.descripcion && <p className="mt-0.5 text-sm text-white/65">{p.descripcion}</p>}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}