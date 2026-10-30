import Link from 'next/link';
import { DEMO, SISTEMA } from '@/lib/config';

// Cartel que deja claro que esta página es un ejemplo y que lo que se vende es el sistema.
export default function DemoBar() {
  if (!DEMO) return null;
  return (
    <div className="bg-tinta px-4 py-1.5 text-center text-xs text-papel">
      <span className="font-semibold">Sitio de demostración.</span>{' '}
      <span className="hidden sm:inline">Este restaurante es un ejemplo de lo que ofrece {SISTEMA.nombre}, el sistema de reservas y pedidos. </span>
      <Link href="/sistema" className="font-semibold text-limon underline underline-offset-2">
        Conocé el sistema →
      </Link>
    </div>
  );
}
