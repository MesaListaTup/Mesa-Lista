import { Poppins } from 'next/font/google';
import './globals.css';

// Poppins no es variable: se declaran los pesos que usa el proyecto.
// Los títulos (font-display) usan solo el peso 600, así se ven más firmes sin tocar cada componente.
const display = Poppins({ subsets: ['latin'], weight: '600', variable: '--font-display' });
const body = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });

export const metadata = {
  title: 'Mesa Lista · Reservá tu mesa',
  description: 'Reservá tu mesa online en Mesa Lista. Elegí día, horario y cantidad de personas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}