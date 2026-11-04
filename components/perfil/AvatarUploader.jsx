'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const LADO = 512; // la foto se recorta cuadrada y se guarda a 512x512
const MAX_ORIGINAL = 10 * 1024 * 1024;

// Recorta el centro de la imagen en un cuadrado y la convierte a JPG liviano (sin librerías)
async function recortarCuadrado(archivo) {
  const bitmap = await createImageBitmap(archivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // fondo para PNG/WebP con transparencia
  ctx.fillRect(0, 0, LADO, LADO);
  ctx.drawImage(bitmap, (bitmap.width - lado) / 2, (bitmap.height - lado) / 2, lado, lado, 0, 0, LADO, LADO);
  bitmap.close?.();
  return new Promise((ok, fallo) => canvas.toBlob((b) => (b ? ok(b) : fallo(new Error('canvas'))), 'image/jpeg', 0.85));
}

export default function AvatarUploader({ userId, fotoUrl, iniciales }) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef(null);
  const [foto, setFoto] = useState(fotoUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  async function alElegir(e) {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    setError('');
    if (!archivo.type.startsWith('image/')) return setError('Elegí una imagen (JPG, PNG o WebP).');
    if (archivo.size > MAX_ORIGINAL) return setError('La imagen pesa demasiado. Elegí una de hasta 10 MB.');

    setSubiendo(true);
    try {
      const blob = await recortarCuadrado(archivo);
      const ruta = `${userId}/avatar.jpg`; // una sola foto por usuario: la nueva reemplaza a la anterior
      const { error: errSubida } = await supabase.storage
        .from('avatares')
        .upload(ruta, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
      if (errSubida) throw errSubida;

      const { data } = supabase.storage.from('avatares').getPublicUrl(ruta);
      const url = `${data.publicUrl}?v=${Date.now()}`; // el ?v= evita que el navegador muestre la foto vieja
      const { error: errPerfil } = await supabase.from('users').update({ foto_url: url }).eq('id', userId);
      if (errPerfil) throw errPerfil;

      setFoto(url);
      router.refresh();
    } catch {
      setError('No pudimos guardar la foto. Probá con otra imagen o de nuevo en un momento.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Tu foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-5xl text-white/80" aria-hidden="true">{iniciales}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={alElegir}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="mt-5 border border-white/70 px-6 py-2.5 text-[12px] font-medium uppercase tracking-[0.3em] text-white transition-colors duration-500 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {subiendo ? 'Subiendo…' : foto ? 'Cambiar foto' : 'Subir foto'}
      </button>
      {error && <p role="alert" className="mt-3 max-w-xs text-center text-sm text-red-200">{error}</p>}
    </div>
  );
}
