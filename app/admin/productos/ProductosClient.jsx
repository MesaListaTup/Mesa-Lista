'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatPrecio } from '@/lib/utils';
import { TIPOS_PLATO } from '@/components/ui/dibujos';

const VACIO = { nombre: '', descripcion: '', precio: '', categoria: 'comida', imagen_url: '', tipo_plato: '' };

export default function ProductosClient({ productos }) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function guardar(e) {
    e.preventDefault();
    setError('');
    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: Number(form.precio),
      categoria: form.categoria,
      // Se envían solo si se completaron (así funciona aunque todavía no se haya corrido v4_imagenes_menu.sql)
      ...(form.imagen_url.trim() || editandoId ? { imagen_url: form.imagen_url.trim() || null } : {}),
      ...(form.tipo_plato || editandoId ? { tipo_plato: form.tipo_plato || null } : {}),
    };
    const { error } = editandoId
      ? await supabase.from('productos').update(datos).eq('id', editandoId)
      : await supabase.from('productos').insert(datos);
    if (error) return setError(error.message);
    setForm(VACIO);
    setEditandoId(null);
    router.refresh();
  }

  function editar(p) {
    setEditandoId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: String(p.precio),
      categoria: p.categoria,
      imagen_url: p.imagen_url ?? '',
      tipo_plato: p.tipo_plato ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function alternar(p) {
    const { error } = await supabase.from('productos').update({ disponible: !p.disponible }).eq('id', p.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function eliminar(p) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Los pedidos anteriores conservan el precio cobrado.`)) return;
    const { error } = await supabase.from('productos').delete().eq('id', p.id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={guardar} className="panel grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_3fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="nombre" className="label">Nombre</label>
          <input id="nombre" required value={form.nombre} onChange={set('nombre')} className="input" />
        </div>
        <div>
          <label htmlFor="desc" className="label">Descripción</label>
          <input id="desc" value={form.descripcion} onChange={set('descripcion')} className="input" />
        </div>
        <div>
          <label htmlFor="precio" className="label">Precio</label>
          <input id="precio" type="number" min="0" step="0.01" required value={form.precio} onChange={set('precio')} className="input" />
        </div>
        <div>
          <label htmlFor="cat" className="label">Categoría</label>
          <select id="cat" value={form.categoria} onChange={set('categoria')} className="input">
            <option value="comida">Comida</option>
            <option value="cafeteria">Cafetería</option>
            <option value="bebida">Bebida</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-dark">{editandoId ? 'Guardar cambios' : 'Agregar'}</button>
          {editandoId && (
            <button type="button" onClick={() => { setEditandoId(null); setForm(VACIO); }} className="btn btn-ghost">Cancelar</button>
          )}
        </div>

        {/* Imagen del plato (opcional): si no hay foto, la carta muestra una ilustración */}
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[3fr_1fr] lg:col-span-5">
          <div>
            <label htmlFor="imagen" className="label">Foto (link a la imagen, opcional)</label>
            <input id="imagen" type="url" placeholder="https://..." value={form.imagen_url} onChange={set('imagen_url')} className="input" />
          </div>
          <div>
            <label htmlFor="tipo" className="label">Ilustración si no hay foto</label>
            <select id="tipo" value={form.tipo_plato} onChange={set('tipo_plato')} className="input">
              <option value="">Automática</option>
              {TIPOS_PLATO.map(([id, nombre]) => (
                <option key={id} value={id}>{nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {error && <p role="alert" className="rounded-md bg-tomate/10 p-3 text-sm text-tomate">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-tinta/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-tinta/10 bg-tinta/5 text-xs text-tinta/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Precio</th>
              <th className="px-4 py-3 font-semibold">Disponible</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta/10">
            {productos.map((p) => (
              <tr key={p.id} className={p.disponible ? '' : 'text-tinta/50'}>
                <td className="px-4 py-3">
                  <p className="font-medium">{p.nombre}</p>
                  {p.descripcion && <p className="text-xs text-tinta/60">{p.descripcion}</p>}
                </td>
                <td className="px-4 py-3 capitalize">{p.categoria}</td>
                <td className="px-4 py-3 tabular-nums">{formatPrecio(p.precio)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => alternar(p)} role="switch" aria-checked={p.disponible} aria-label={`Disponibilidad de ${p.nombre}`} className={`relative h-6 w-11 rounded-full transition-colors ${p.disponible ? 'bg-tinta' : 'bg-tinta/25'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${p.disponible ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => editar(p)} className="btn btn-ghost btn-sm">Editar</button>
                    <button onClick={() => eliminar(p)} className="btn btn-ghost btn-sm text-tomate">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
