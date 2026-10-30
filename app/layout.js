import { Young_Serif, Figtree } from 'next/font/google';
import './globals.css';

const display = Young_Serif({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const body = Figtree({ subsets: ['latin'], variable: '--font-body' });

export const metadata = {
  title: 'Mesa Lista · Sistema de reservas y pedidos para restaurantes',
  description: 'Mesa Lista es el sistema de reservas, mesas y pedidos para restaurantes. Probá la demo.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
