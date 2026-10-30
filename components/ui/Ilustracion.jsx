import { DIBUJOS } from './dibujos';

// Ilustración del menú (SVG propio, contenido estático y de confianza)
export default function Ilustracion({ tipo = 'plato', titulo, className = '' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={titulo ?? tipo}
      className={className}
      fill="none"
      stroke="#15233B"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: DIBUJOS[tipo] ?? DIBUJOS.plato }}
    />
  );
}
