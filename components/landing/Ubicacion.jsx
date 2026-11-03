import { RESTAURANTE } from '@/lib/config';
import Reveal from './Reveal';

const etiqueta = 'text-[13px] font-semibold uppercase tracking-[0.3em] text-white/55';

// Redes del restaurante: reemplazá estos dos links por los de Mesa Lista.
const INSTAGRAM_URL = 'https://www.instagram.com/';
const FACEBOOK_URL = 'https://www.facebook.com/';

// Íconos de línea (24x24), heredan el color del texto (blanco).
const propsIcono = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'h-6 w-6',
};

function IconoInstagram() {
  return (
    <svg {...propsIcono}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M17.6 6.4h.01" />
    </svg>
  );
}

function IconoFacebook() {
  return (
    <svg {...propsIcono}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconoWhatsapp() {
  return (
    <svg {...propsIcono}>
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

export default function Ubicacion() {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(RESTAURANTE.mapaQuery)}&output=embed`;
  const telefonoLink = `tel:${RESTAURANTE.telefono.replace(/\s/g, '')}`;
  // WhatsApp en Argentina exige el 9 después del 54 en celulares: 54 9 11 ...
  const digitos = RESTAURANTE.telefono.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${digitos.startsWith('54') && !digitos.startsWith('549') ? `549${digitos.slice(2)}` : digitos}`;
  const redes = [
    { nombre: 'Instagram', href: INSTAGRAM_URL, Icono: IconoInstagram },
    { nombre: 'Facebook', href: FACEBOOK_URL, Icono: IconoFacebook },
    { nombre: 'WhatsApp', href: whatsappLink, Icono: IconoWhatsapp },
  ];
  return (
    <section id="visitanos" className="scroll-mt-20 py-20 text-white md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-14">
        <Reveal>
          <p className={etiqueta}>Visitanos</p>
          <h2 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl">Dónde encontrarnos</h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Reveal className="relative space-y-8 rounded-2xl border border-white/10 bg-white/5 p-7 md:p-9">
            <div>
              <h3 className={etiqueta}>Dirección</h3>
              <p className="mt-3 text-lg">
                {RESTAURANTE.direccion}
                <br />
                {RESTAURANTE.ciudad}
              </p>
            </div>
            <div>
              <h3 className={etiqueta}>Horarios</h3>
              <ul className="mt-3 space-y-1 text-white/80">
                {RESTAURANTE.horarios.map((h) => (
                  <li key={h.turno}>
                    <span className="font-semibold text-white">{h.turno}:</span> {h.horas}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-white/55">
                {RESTAURANTE.horarios[0].dias}. {RESTAURANTE.cerrado}.
              </p>
            </div>
            <div>
              <h3 className={etiqueta}>Contacto</h3>
              <p className="mt-3 space-y-1 text-white/80">
                <a href={telefonoLink} className="block hover:text-white">{RESTAURANTE.telefono}</a>
                <a href={`mailto:${RESTAURANTE.email}`} className="block break-all hover:text-white">{RESTAURANTE.email}</a>
              </p>
            </div>

            {/* Redes: esquina superior derecha (!mt-0 anula el margen de space-y, que correría el bloque) */}
            <div className="absolute right-5 top-5 !mt-0 flex items-center md:right-7 md:top-7">
              {redes.map(({ nombre, href, Icono }) => (
                <a
                  key={nombre}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={nombre}
                  className="flex h-10 w-10 items-center justify-center text-white transition-opacity duration-300 hover:opacity-60"
                >
                  <Icono />
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal className="relative min-h-80 overflow-hidden rounded-2xl border border-white/10 lg:min-h-[440px]" delay={150}>
            <iframe
              title={`Mapa de ${RESTAURANTE.nombre}`}
              src={src}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}