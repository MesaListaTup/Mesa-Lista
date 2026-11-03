'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Reveal from './Reveal';

const etiqueta = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';
const campo = 'input border-white/25 bg-white/10 text-white placeholder:text-white/40 focus:border-white focus:ring-white/25';

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
    <section id="contacto" className="scroll-mt-20 py-20 text-white md:py-28">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-6 md:px-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className={etiqueta}>Escribinos</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">Contacto</h2>
          <p className="mt-6 max-w-md text-lg text-white/75">
            ¿Una consulta, un evento o un comentario? Escribinos y te respondemos por mail.
          </p>
        </Reveal>

        <Reveal className="lg:col-span-7" delay={150}>
          {ok ? (
            <p className="rounded-2xl bg-sifon p-6 text-tinta" role="status">
              ¡Gracias! Recibimos tu mensaje y te vamos a responder pronto.
            </p>
          ) : (
            <form onSubmit={enviar} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-9">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-nombre" className="label text-white/80">Nombre</label>
                  <input id="c-nombre" className={campo} required minLength={2} value={form.nombre} onChange={cambiar('nombre')} />
                </div>
                <div>
                  <label htmlFor="c-email" className="label text-white/80">E-mail</label>
                  <input id="c-email" type="email" className={campo} required value={form.email} onChange={cambiar('email')} />
                </div>
              </div>
              <div>
                <label htmlFor="c-mensaje" className="label text-white/80">Mensaje</label>
                <textarea id="c-mensaje" className={`${campo} min-h-36`} required minLength={5} value={form.mensaje} onChange={cambiar('mensaje')} />
              </div>
              {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
              <button
                className="w-full border border-white/70 px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                disabled={enviando}
              >
                {enviando ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}