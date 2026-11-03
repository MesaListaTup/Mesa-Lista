import { Poppins } from 'next/font/google';
import './globals.css';

// Poppins no es variable: se declaran los pesos que usa el proyecto.
// Los títulos (font-display) usan solo el peso 600, así se ven más firmes sin tocar cada componente.
const display = Poppins({ subsets: ['latin'], weight: '600', variable: '--font-display' });
const body = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });

// Para volver a Persona (títulos) + Caslon (textos), que siguen en public/fonts:
//   1. Reemplazá el import de Poppins por: import localFont from 'next/font/local';
//   2. Reemplazá las constantes display y body de arriba por:
//        const display = localFont({ src: [{ path: '../public/fonts/Persona-Medium.woff', weight: '500', style: 'normal' }], variable: '--font-display', display: 'swap' });
//        const body = localFont({ src: [{ path: '../public/fonts/FCaslon+30+ITC+Regular.ttf', weight: '400', style: 'normal' }], variable: '--font-body', display: 'swap' });
//   3. En globals.css agregá font-synthesis: none; en la regla de html (esas fuentes tienen un solo peso).

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