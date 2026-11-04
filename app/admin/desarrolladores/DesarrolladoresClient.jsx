'use client';

import { useEffect, useRef, useState } from 'react';
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

// Tarjeta de un desarrollador. Sin "d" funciona como formulario para agregar uno nuevo.
function Tarjeta({ d = null, siguienteOrden = 1, onListo }) {
  const supabase = createClient();
  const router = useRouter();
  const nuevo = d === null;
  const tarjetaRef = useRef(null);

  const [idNuevo] = useState(() => (nuevo ? crypto.randomUUID() : null)); // id propio para poder subir la foto antes de crear la fila
  const id = nuevo ? idNuevo : d.id;

  const [nombre, setNombre] = useState(d?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(d?.descripcion ?? '');
  const [archivo, setArchivo] = useState(null); // foto nueva elegida, todavía sin subir
  const [preview, setPreview] = useState(null);
  const [quitar, setQuitar] = useState(false); // volver a la foto por defecto
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);

  // Al abrir el formulario de alta, se lleva a la vista
  useEffect(() => {
    if (nuevo) tarjetaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [nuevo]);

  useEffect(() => {
    if (!archivo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const fotoGuardada = quitar ? null : d?.foto_url ?? null;
  const mostrada = preview || fotoGuardada || FOTO_POR_DEFECTO;
  const tieneFoto = Boolean(preview || fotoGuardada);
  const hayCambios = nuevo
    ? nombre.trim().length >= 2
    : archivo !== null || quitar || nombre.trim() !== d.nombre || descripcion.trim() !== (d.descripcion ?? '');

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
    else if (d?.foto_url) setQuitar(true); // marca la foto guardada para borrar
  }

  function deshacer() {
    setNombre(d?.nombre ?? '');
    setDescripcion(d?.descripcion ?? '');
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

    let fotoUrl = d?.foto_url ?? null;
    let fotoPath = d?.foto_path ?? null;
    let rutaNueva = null;

    try {
      if (archivo) {
        const blob = await prepararFoto(archivo).catch(() => {
          throw new Error('No se pudo leer la imagen. Probá con otra en formato JPG, PNG o WEBP.');
        });
        rutaNueva = `${id}/${Date.now()}.jpg`; // nombre único: no hay problemas de caché al reemplazar
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

      const datos = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        foto_url: fotoUrl,
        foto_path: fotoPath,
      };

      const { error: errorGuardar } = nuevo
        ? await supabase.from('desarrolladores').insert({ id, ...datos, orden: siguienteOrden })
        : await supabase.from('desarrolladores').update(datos).eq('id', id);

      if (errorGuardar) {
        if (rutaNueva) await supabase.storage.from(BUCKET).remove([rutaNueva]); // no dejar fotos huérfanas
        throw errorGuardar;
      }

      // La foto anterior ya no se usa: se borra del bucket
      if (!nuevo && (archivo || quitar) && d.foto_path) await supabase.storage.from(BUCKET).remove([d.foto_path]);

      router.refresh();
      if (nuevo) {
        onListo?.(); // cierra el formulario: la persona ya aparece en la lista
        return;
      }
      setArchivo(null);
      setQuitar(false);
      setGuardado(true);
    } catch (err) {
      setError(err?.message || 'No se pudo guardar. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${d.nombre} del equipo? Esta acción no se puede deshacer.`)) return;
    setGuardando(true);
    setError('');
    const { error: errorBorrar } = await supabase.from('desarrolladores').delete().eq('id', d.id);
    if (errorBorrar) {
      setGuardando(false);
      return setError(errorBorrar.message);
    }
    if (d.foto_path) await supabase.storage.from(BUCKET).remove([d.foto_path]);
    router.refresh();
  }

  return (
    <form ref={tarjetaRef} onSubmit={guardar} className={`panel flex flex-col gap-4 ${nuevo ? 'ring-2 ring-tinta/30' : ''}`}>
      {nuevo && <h2 className="font-display text-xl">Nuevo desarrollador</h2>}

      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border border-tinta/10 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mostrada} alt={tieneFoto ? 'Foto elegida' : 'Foto por defecto'} className="h-full w-full object-cover" />
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
        <label htmlFor={`dev-${id}-nombre`} className="label">Nombre</label>
        <input
          id={`dev-${id}-nombre`}
          className="input"
          required
          minLength={2}
          autoFocus={nuevo}
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setGuardado(false);
          }}
        />
      </div>
      <div>
        <label htmlFor={`dev-${id}-desc`} className="label">Descripción</label>
        <textarea
          id={`dev-${id}-desc`}
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
          {guardando ? 'Guardando…' : nuevo ? 'Agregar al equipo' : 'Guardar cambios'}
        </button>
        {nuevo ? (
          <button type="button" onClick={onListo} disabled={guardando} className="btn btn-ghost">Cancelar</button>
        ) : (
          hayCambios && !guardando && <button type="button" onClick={deshacer} className="btn btn-ghost">Deshacer</button>
        )}
      </div>

      {!nuevo && (
        <button type="button" onClick={eliminar} disabled={guardando} className="self-start text-xs text-tomate underline underline-offset-2 hover:no-underline disabled:opacity-50">
          Eliminar del equipo
        </button>
      )}
    </form>
  );
}

export default function DesarrolladoresClient({ desarrolladores }) {
  const [agregando, setAgregando] = useState(false);
  // La persona nueva aparece al final de la página pública
  const siguienteOrden = desarrolladores.reduce((max, d) => Math.max(max, d.orden ?? 0), 0) + 1;

  return (
    <div className="space-y-5">
      {desarrolladores.length === 0 && !agregando && (
        <p className="text-sm text-tinta/70">Todavía no hay desarrolladores cargados. Agregá el primero.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        {desarrolladores.map((d) => (
          <Tarjeta key={d.id} d={d} />
        ))}

        {agregando ? (
          <Tarjeta key="nuevo" siguienteOrden={siguienteOrden} onListo={() => setAgregando(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-tinta/25 p-6 text-tinta/70 transition-colors hover:border-tinta hover:text-tinta"
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-sm font-medium">Agregar desarrollador</span>
          </button>
        )}
      </div>
    </div>
  );
}