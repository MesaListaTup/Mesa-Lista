import { createClient } from '@/lib/supabase/server';
import { formatCodigo, fechaHoraAR } from '@/lib/cupones';
import CuponesClient from './CuponesClient';

export const metadata = { title: 'Cupones · Panel · Mesa Lista' };

export default async function CuponesPage() {
  const supabase = createClient();
  const { data: usados } = await supabase
    .from('cupones')
    .select('id, codigo, nombre, descuento, usado_at, usuario:usuario_id(nombre, apellido)')
    .eq('estado', 'usado')
    .order('usado_at', { ascending: false })
    .limit(15);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Cupones</h1>
        <p className="mt-2 text-sm text-tinta/70">
          El cliente te muestra su código. Verificalo acá y, si es válido, aplicá el descuento en su cuenta: el cupón deja de servir.
        </p>
      </div>

      <CuponesClient />

      <section>
        <h2 className="font-semibold">Últimos cupones aplicados</h2>
        {usados?.length ? (
          <div className="panel mt-3 divide-y divide-tinta/10 !p-0">
            {usados.map((c) => (
              <div key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <p>
                  <span className="font-mono font-semibold tracking-wider">{formatCodigo(c.codigo)}</span>
                  <span className="text-tinta/70"> · {c.nombre}</span>
                </p>
                <p className="text-tinta/60">
                  {[c.usuario?.nombre, c.usuario?.apellido].filter(Boolean).join(' ') || 'Cliente'} · {fechaHoraAR(c.usado_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="panel mt-3 text-sm text-tinta/70">Todavía no se aplicó ningún cupón.</p>
        )}
      </section>
    </div>
  );
}
