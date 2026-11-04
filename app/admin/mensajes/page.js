import { createClient } from '@/lib/supabase/server';
import MensajesList from './MensajesList';

export default async function MensajesPage() {
  const supabase = createClient();
  const { data: mensajes } = await supabase
    .from('mensajes_contacto')
    .select('id,nombre,email,mensaje,leido,created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Mensajes</h1>
      <MensajesList mensajes={mensajes ?? []} />
    </div>
  );
}
