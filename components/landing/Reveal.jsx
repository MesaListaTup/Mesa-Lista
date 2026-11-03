'use client';

import { useEffect, useRef, useState } from 'react';

// Aparición suave al entrar en pantalla: sube unos píxeles y pasa de transparente a visible.
// Se anima una sola vez. Con "reducir movimiento" (o sin IntersectionObserver) se muestra directo.
// className va en el contenedor, así que acá se ponen las clases de grilla/tarjeta del bloque.
// delay (ms) sirve para escalonar bloques hermanos.
export default function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`transition-[opacity,transform] duration-[900ms] ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}
