'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function MensajesList({ mensajes }) {
  const supabase = createClient();
  const router = useRouter();
  const [error, setError] = useState('');

  async function marcar(id, leido) {
    const { error } = await supabase.from('mensajes_contacto').update({ leido }).eq('id', id);
    if (error) return setError(error.message);
    router.refresh();
  }

  if (!mensajes.length) return <p className="panel text-sm text-tinta/70">Todavía no hay mensajes.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-tomate" role="alert">{error}</p>}
      {mensajes.map((m) => (
        <article key={m.id} className={`panel ${m.leido ? 'opacity-60' : ''}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">{m.nombre}</p>
            <p className="text-xs text-tinta/60">{new Date(m.created_at).toLocaleString('es-AR')}</p>
          </div>
          <a href={`mailto:${m.email}`} className="text-sm text-tomate underline">{m.email}</a>
          <p className="mt-2 whitespace-pre-wrap text-sm">{m.mensaje}</p>
          <button className="btn btn-ghost btn-sm mt-3" onClick={() => marcar(m.id, !m.leido)}>
            {m.leido ? 'Marcar como no leído' : 'Marcar como leído'}
          </button>
        </article>
      ))}
    </div>
  );
}
