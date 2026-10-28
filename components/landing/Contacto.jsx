'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Contacto() {
  const supabase = createClient();
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    const { error } = await supabase.rpc('crear_mensaje_contacto', {
      p_nombre: form.nombre,
      p_email: form.email,
      p_mensaje: form.mensaje,
    });
    setEnviando(false);
    if (error) return setError(error.message);
    setOk(true);
    setForm({ nombre: '', email: '', mensaje: '' });
  }

  return (
    <section id="contacto" className="border-t border-tinta/10 bg-white">
      <div className="mx-auto max-w-xl px-5 py-20">
        <h2 className="font-display text-4xl sm:text-5xl">Contacto</h2>
        <p className="mt-3 text-tinta/75">¿Una consulta, un evento o un comentario? Escribinos y te respondemos por mail.</p>

        {ok ? (
          <p className="mt-8 rounded-md bg-sifon p-4 text-sm" role="status">
            ¡Gracias! Recibimos tu mensaje y te vamos a responder pronto.
          </p>
        ) : (
          <form onSubmit={enviar} className="mt-8 space-y-4">
            <div>
              <label htmlFor="c-nombre" className="label">Nombre</label>
              <input id="c-nombre" className="input" required minLength={2} value={form.nombre} onChange={cambiar('nombre')} />
            </div>
            <div>
              <label htmlFor="c-email" className="label">E-mail</label>
              <input id="c-email" type="email" className="input" required value={form.email} onChange={cambiar('email')} />
            </div>
            <div>
              <label htmlFor="c-mensaje" className="label">Mensaje</label>
              <textarea id="c-mensaje" className="input min-h-32" required minLength={5} value={form.mensaje} onChange={cambiar('mensaje')} />
            </div>
            {error && <p className="text-sm text-tomate" role="alert">{error}</p>}
            <button className="btn btn-primary w-full" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
