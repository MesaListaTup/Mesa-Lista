'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError('');
    setAviso('');

    if (modo === 'registro') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      });
      setCargando(false);
      if (error) return setError(error.message);
      if (!data.session) return setAviso('Te enviamos un email para confirmar tu cuenta. Después podés ingresar.');
      router.push('/');
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setCargando(false);
      return setError('Email o contraseña incorrectos.');
    }
    const { data: perfil } = await supabase.from('users').select('rol').eq('id', data.user.id).single();
    router.push(['admin', 'staff'].includes(perfil?.rol) ? '/admin' : '/');
    router.refresh();
  }

  return (
    <main className="gingham flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm rounded-lg bg-white p-7 shadow-xl">
        <Link href="/" className="font-display text-2xl">Mesa Lista</Link>
        <h1 className="mt-6 text-xl font-semibold">{modo === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}</h1>

        <form onSubmit={enviar} className="mt-5 space-y-4">
          {modo === 'registro' && (
            <div>
              <label htmlFor="nombre" className="label">Nombre</label>
              <input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" autoComplete="name" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="label">Contraseña</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />
          </div>

          {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}
          {aviso && <p role="status" className="rounded-md bg-sifon p-3 text-sm">{aviso}</p>}

          <button disabled={cargando} className="btn btn-dark w-full py-3">
            {cargando ? 'Un momento…' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); setAviso(''); }}
          className="mt-5 text-sm text-tinta/70 underline underline-offset-2 hover:text-tinta"
        >
          {modo === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Ingresá'}
        </button>
      </div>
    </main>
  );
}
