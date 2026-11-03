'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BUCKET, FOTO_POR_DEFECTO } from '@/lib/desarrolladores';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ARCHIVO = 10 * 1024 * 1024; // límite de lo que se puede elegir; la foto se reduce antes de subirla

// Recorta al centro en proporción 4:5 y reduce a 720 px de ancho como máximo (JPEG).
// Así todas las fotos pesan poco y se ven igual que en la vista previa.
async function prepararFoto(archivo) {
  const imagen = await createImageBitmap(archivo);
  const RATIO = 4 / 5;
  let sw = imagen.width;
  let sh = imagen.height;
  if (sw / sh > RATIO) sw = sh * RATIO;
  else sh = sw / RATIO;
  const sx = (imagen.width - sw) / 2;
  const sy = (imagen.height - sh) / 2;

  const escala = Math.min(1, 720 / sw);
  const w = Math.round(sw * escala);
  const h = Math.round(sh * escala);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // fondo blanco para PNG con transparencia
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(imagen, sx, sy, sw, sh, 0, 0, w, h);
  imagen.close?.();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen.'))), 'image/jpeg', 0.86)
  );
}

function Tarjeta({ d }) {
  const supabase = createClient();
  const router = useRouter();

  const [nombre, setNombre] = useState(d.nombre);
  const [descripcion, setDescripcion] = useState(d.descripcion ?? '');
  const [archivo, setArchivo] = useState(null); // foto nueva elegida, todavía sin subir
  const [preview, setPreview] = useState(null);
  const [quitar, setQuitar] = useState(false); // volver a la foto por defecto
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!archivo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const fotoGuardada = quitar ? null : d.foto_url;
  const mostrada = preview || fotoGuardada || FOTO_POR_DEFECTO;
  const tieneFoto = Boolean(preview || fotoGuardada);
  const hayCambios =
    archivo !== null || quitar || nombre.trim() !== d.nombre || descripcion.trim() !== (d.descripcion ?? '');

  function elegirArchivo(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setGuardado(false);
    if (!TIPOS.includes(f.type)) return setError('Elegí una imagen JPG, PNG o WEBP.');
    if (f.size > MAX_ARCHIVO) return setError('La imagen pesa más de 10 MB. Elegí una más liviana.');
    setError('');
    setArchivo(f);
    setQuitar(false);
  }

  function quitarFoto() {
    setGuardado(false);
    if (archivo) setArchivo(null); // descarta la foto nueva
    else if (d.foto_url) setQuitar(true); // marca la foto guardada para borrar
  }

  function deshacer() {
    setNombre(d.nombre);
    setDescripcion(d.descripcion ?? '');
    setArchivo(null);
    setQuitar(false);
    setError('');
    setGuardado(false);
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError('');
    setGuardado(false);

    let fotoUrl = d.foto_url;
    let fotoPath = d.foto_path;
    let rutaNueva = null;

    try {
      if (archivo) {
        const blob = await prepararFoto(archivo).catch(() => {
          throw new Error('No se pudo leer la imagen. Probá con otra en formato JPG, PNG o WEBP.');
        });
        rutaNueva = `${d.id}/${Date.now()}.jpg`; // nombre único: no hay problemas de caché al reemplazar
        const { error: errorSubida } = await supabase.storage
          .from(BUCKET)
          .upload(rutaNueva, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (errorSubida) throw errorSubida;
        fotoUrl = supabase.storage.from(BUCKET).getPublicUrl(rutaNueva).data.publicUrl;
        fotoPath = rutaNueva;
      } else if (quitar) {
        fotoUrl = null;
        fotoPath = null;
      }

      const { error: errorUpdate } = await supabase
        .from('desarrolladores')
        .update({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          foto_url: fotoUrl,
          foto_path: fotoPath,
        })
        .eq('id', d.id);

      if (errorUpdate) {
        if (rutaNueva) await supabase.storage.from(BUCKET).remove([rutaNueva]); // no dejar fotos huérfanas
        throw errorUpdate;
      }

      // La foto anterior ya no se usa: se borra del bucket
      if ((archivo || quitar) && d.foto_path) await supabase.storage.from(BUCKET).remove([d.foto_path]);

      setArchivo(null);
      setQuitar(false);
      setGuardado(true);
      router.refresh();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="panel flex flex-col gap-4">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border border-tinta/10 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mostrada} alt={tieneFoto ? `Foto de ${d.nombre}` : 'Foto por defecto'} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="btn btn-ghost btn-sm cursor-pointer focus-within:ring-2 focus-within:ring-tomate">
          {tieneFoto ? 'Cambiar foto' : 'Subir foto'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirArchivo} className="sr-only" />
        </label>
        {tieneFoto && (
          <button type="button" onClick={quitarFoto} className="btn btn-ghost btn-sm text-tomate">
            Quitar foto
          </button>
        )}
      </div>
      {!tieneFoto && <p className="-mt-2 text-xs text-tinta/60">Sin foto cargada: se muestra la foto por defecto.</p>}
      {archivo && <p className="-mt-2 text-xs text-tinta/60">La foto nueva se recorta al centro y se sube al guardar.</p>}

      <div>
        <label htmlFor={`dev-${d.id}-nombre`} className="label">Nombre</label>
        <input
          id={`dev-${d.id}-nombre`}
          className="input"
          required
          minLength={2}
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setGuardado(false);
          }}
        />
      </div>
      <div>
        <label htmlFor={`dev-${d.id}-desc`} className="label">Descripción</label>
        <textarea
          id={`dev-${d.id}-desc`}
          className="input min-h-28"
          maxLength={400}
          value={descripcion}
          onChange={(e) => {
            setDescripcion(e.target.value);
            setGuardado(false);
          }}
        />
      </div>

      {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}
      {guardado && !hayCambios && <p role="status" className="rounded-md bg-sifon p-3 text-sm">Cambios guardados.</p>}

      <div className="mt-auto flex gap-2">
        <button className="btn btn-dark flex-1" disabled={!hayCambios || guardando || nombre.trim().length < 2}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {hayCambios && !guardando && (
          <button type="button" onClick={deshacer} className="btn btn-ghost">Deshacer</button>
        )}
      </div>
    </form>
  );
}

export default function DesarrolladoresClient({ desarrolladores }) {
  if (desarrolladores.length === 0) {
    return <p className="panel text-sm text-tinta/70">No hay desarrolladores cargados. Ejecutá el SQL de la migración V7 para crear los iniciales.</p>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
      {desarrolladores.map((d) => (
        <Tarjeta key={d.id} d={d} />
      ))}
    </div>
  );
}
