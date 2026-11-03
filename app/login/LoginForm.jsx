'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hoyAR } from '@/lib/utils';
import { PUNTOS_POR_RESERVA } from '@/lib/puntos';
import Reveal from '@/components/landing/Reveal';

// Campos translúcidos, iguales a los del formulario de contacto de la landing
const campo = 'input border-white/25 bg-white/10 text-white placeholder:text-white/40 focus:border-white focus:ring-white/25 [color-scheme:dark]';
const etiqueta = 'label text-white/80';
const etiquetaChica = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';

const soloDigitos = (v) => v.replace(/\D/g, '');

function traducir(mensaje = '') {
  if (/already registered|already been registered/i.test(mensaje)) return 'Ese email ya tiene una cuenta. Ingresá con tu contraseña.';
  if (/password should be at least/i.test(mensaje)) return 'La contraseña debe tener al menos 6 caracteres.';
  if (/rate limit/i.test(mensaje)) return 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.';
  return 'No pudimos crear la cuenta. Revisá los datos y probá de nuevo.';
}

export default function LoginForm({ modoInicial = 'login' }) {
  const supabase = createClient();
  const router = useRouter();
  const [modo, setModo] = useState(modoInicial); // 'login' | 'registro'
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNac, setFechaNac] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  const registro = modo === 'registro';

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setAviso('');

    if (registro) {
      const dniLimpio = soloDigitos(dni);
      if (!/^\d{7,8}$/.test(dniLimpio)) return setError('Ingresá tu DNI sin puntos (7 u 8 números).');
      if (!fechaNac || fechaNac > hoyAR() || fechaNac < '1900-01-01') return setError('Revisá tu fecha de nacimiento.');

      setCargando(true);
      // Un DNI, una cuenta: se avisa antes de crear nada
      const { data: existe, error: errDni } = await supabase.rpc('dni_registrado', { p_dni: dniLimpio });
      if (errDni) {
        setCargando(false);
        return setError('No pudimos verificar tus datos. Probá de nuevo en un momento.');
      }
      if (existe) {
        setCargando(false);
        return setError('Ya hay una cuenta registrada con ese DNI.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre: nombre.trim(), apellido: apellido.trim(), fecha_nacimiento: fechaNac, dni: dniLimpio },
        },
      });
      setCargando(false);
      if (error) return setError(traducir(error.message));
      // Con confirmación por mail activa, un email ya registrado no da error: vuelve sin identidades
      if (data.user && data.user.identities?.length === 0) return setError(traducir('already registered'));
      if (!data.session) return setAviso('Te enviamos un email para confirmar tu cuenta. Después podés ingresar.');
      router.push('/perfil');
      router.refresh();
      return;
    }

    setCargando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setCargando(false);
      return setError('Email o contraseña incorrectos.');
    }
    const { data: perfil } = await supabase.from('users').select('rol').eq('id', data.user.id).single();
    router.push(['admin', 'staff'].includes(perfil?.rol) ? '/admin' : '/');
    router.refresh();
  }

  function cambiarModo() {
    setModo(registro ? 'login' : 'registro');
    setError('');
    setAviso('');
  }

  return (
    <Reveal className="w-full">
      <div className={`mx-auto w-full rounded-2xl border border-white/10 bg-white/5 p-7 md:p-10 ${registro ? 'max-w-2xl' : 'max-w-md'}`}>
        <p className={etiquetaChica}>{registro ? 'Registro' : 'Tu cuenta'}</p>
        <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl">
          {registro ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
        </h1>
        {registro && (
          <p className="mt-4 text-white/75">
            Con tu cuenta sumás {PUNTOS_POR_RESERVA} puntos en cada reserva y podés ver tu perfil.
          </p>
        )}

        <form onSubmit={enviar} className="mt-8 space-y-5">
          {registro && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="nombre" className={etiqueta}>Nombre</label>
                  <input id="nombre" required minLength={2} value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} autoComplete="given-name" />
                </div>
                <div>
                  <label htmlFor="apellido" className={etiqueta}>Apellido</label>
                  <input id="apellido" required minLength={2} value={apellido} onChange={(e) => setApellido(e.target.value)} className={campo} autoComplete="family-name" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="nacimiento" className={etiqueta}>Fecha de nacimiento</label>
                  <input id="nacimiento" type="date" required min="1900-01-01" max={hoyAR()} value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} className={campo} autoComplete="bday" />
                </div>
                <div>
                  <label htmlFor="dni" className={etiqueta}>DNI</label>
                  <input
                    id="dni"
                    required
                    inputMode="numeric"
                    maxLength={8}
                    pattern="[0-9]{7,8}"
                    title="7 u 8 números, sin puntos"
                    value={dni}
                    onChange={(e) => setDni(soloDigitos(e.target.value))}
                    className={campo}
                    placeholder="Sin puntos"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className={etiqueta}>Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={campo} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className={etiqueta}>Contraseña</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={campo}
              autoComplete={registro ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <p role="alert" className="rounded-md bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
          {aviso && <p role="status" className="rounded-md bg-sifon p-3 text-sm text-tinta">{aviso}</p>}

          <button
            disabled={cargando}
            className="w-full border border-white/70 px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? 'Un momento…' : registro ? 'Crear cuenta' : 'Ingresar'}
          </button>
        </form>

        <button type="button" onClick={cambiarModo} className="mt-6 text-sm text-white/70 underline underline-offset-4 hover:text-white">
          {registro ? '¿Ya tenés cuenta? Ingresá' : '¿No tenés cuenta? Registrate'}
        </button>
      </div>
    </Reveal>
  );
}
