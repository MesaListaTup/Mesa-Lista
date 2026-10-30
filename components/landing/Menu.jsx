import { createClient } from '@/lib/supabase/server';
import { formatPrecio } from '@/lib/utils';
import Ilustracion from '@/components/ui/Ilustracion';
import { tipoDePlato } from '@/components/ui/dibujos';

const CATEGORIAS = [
  { id: 'comida', titulo: 'Para comer' },
  { id: 'cafeteria', titulo: 'Cafetería' },
  { id: 'bebida', titulo: 'Para tomar' },
];

async function cargarProductos(supabase) {
  // Con foto y tipo de plato (si ya se corrió v4_imagenes_menu.sql); si no, la consulta de siempre
  const completo = await supabase
    .from('productos')
    .select('id,nombre,descripcion,precio,categoria,imagen_url,tipo_plato')
    .eq('disponible', true)
    .order('precio', { ascending: false });
  if (!completo.error) return completo.data;
  const basico = await supabase
    .from('productos')
    .select('id,nombre,descripcion,precio,categoria')
    .eq('disponible', true)
    .order('precio', { ascending: false });
  return basico.data;
}

export default async function Menu() {
  const supabase = createClient();
  const productos = await cargarProductos(supabase);

  return (
    <section id="menu" className="mx-auto max-w-6xl px-5 py-20">
      <h2 className="font-display text-4xl sm:text-5xl">Lo que sale de la cocina</h2>
      <p className="mt-3 max-w-xl text-tinta/75">
        Cocina de bodegón con producto fresco. La carta se actualiza todos los días según lo que haya en el mercado.
      </p>

      {!productos?.length ? (
        <p className="mt-10 rounded-md bg-sifon p-4 text-sm">La carta se está actualizando. Volvé en un rato.</p>
      ) : (
        <div className="mt-12 space-y-14">
          {CATEGORIAS.map((cat) => {
            const items = productos.filter((p) => p.categoria === cat.id);
            if (!items.length) return null;
            return (
              <div key={cat.id}>
                <h3 className="border-b-2 border-tinta pb-2 font-display text-2xl">{cat.titulo}</h3>
                <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <li key={p.id} className="overflow-hidden rounded-lg border border-tinta/10 bg-white">
                      <div className="flex aspect-[4/3] items-center justify-center bg-sifon/60">
                        {p.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imagen_url} alt={p.nombre} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <Ilustracion tipo={tipoDePlato(p)} titulo={p.nombre} className="h-4/5 w-4/5" />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold">{p.nombre}</span>
                          <span className="shrink-0 tabular-nums">{formatPrecio(p.precio)}</span>
                        </div>
                        {p.descripcion && <p className="mt-1 text-sm text-tinta/65">{p.descripcion}</p>}
                      </div>
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
