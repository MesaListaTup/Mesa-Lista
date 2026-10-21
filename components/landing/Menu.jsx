import { createClient } from '@/lib/supabase/server';
import { formatPrecio } from '@/lib/utils';

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
    <section id="menu" className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="font-display text-4xl sm:text-5xl">Lo que sale de la cocina</h2>
      <p className="mt-3 max-w-xl text-tinta/75">
        Cocina de bodegón con producto fresco. La carta se actualiza todos los días según lo que haya en el mercado.
      </p>

      {!productos?.length ? (
        <p className="mt-10 rounded-md bg-sifon p-4 text-sm">La carta se está actualizando. Volvé en un rato.</p>
      ) : (
        <div className="mt-12 grid gap-12 md:grid-cols-3">
          {CATEGORIAS.map((cat) => {
            const items = productos.filter((p) => p.categoria === cat.id);
            if (!items.length) return null;
            return (
              <div key={cat.id}>
                <h3 className="border-b-2 border-tinta pb-2 font-display text-2xl">{cat.titulo}</h3>
                <ul className="mt-4 divide-y divide-tinta/10">
                  {items.map((p) => (
                    <li key={p.id} className="py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">{p.nombre}</span>
                        <span className="shrink-0 tabular-nums">{formatPrecio(p.precio)}</span>
                      </div>
                      {p.descripcion && <p className="mt-0.5 text-sm text-tinta/65">{p.descripcion}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
