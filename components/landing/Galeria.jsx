'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { RESTAURANTE } from '@/lib/config';
import Reveal from './Reveal';

// 8 fotos verticales: 2 columnas en celular y 4 desde escritorio. Las rutas están en RESTAURANTE.galeria.
// Al tocar una foto se ve ampliada y limpia (sin botones ni flechas). Se cierra tocando fuera de la imagen
// o con la tecla Escape.
export default function Galeria() {
  const [indice, setIndice] = useState(null); // foto abierta
  const [visible, setVisible] = useState(false); // controla la animación de entrada y salida
  const origenRef = useRef(null); // miniatura que abrió la foto: al cerrar se le devuelve el foco
  const dialogoRef = useRef(null);
  const timerRef = useRef(null);

  function abrir(i, ev) {
    origenRef.current = ev.currentTarget;
    clearTimeout(timerRef.current);
    setIndice(i);
  }

  const cerrar = useCallback(() => {
    setVisible(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIndice(null);
      origenRef.current?.focus?.();
    }, 250);
  }, []);

  // Foto abierta: anima la entrada, bloquea el scroll, enfoca el visor y cierra con Escape
  useEffect(() => {
    if (indice === null) return;
    const cuadro = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    dialogoRef.current?.focus();

    const alTeclear = (e) => {
      if (e.key === 'Escape') cerrar();
      if (e.key === 'Tab') e.preventDefault(); // el foco no se escapa a la página de atrás
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      cancelAnimationFrame(cuadro);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', alTeclear);
    };
  }, [indice, cerrar]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const abierta = indice !== null ? RESTAURANTE.galeria[indice] : null;

  return (
    <section id="galeria" className="scroll-mt-20 pb-20 text-white md:pb-28">
      <h2 className="sr-only">Galería</h2>
      <ul className="mx-auto grid max-w-[1600px] grid-cols-2 gap-3 px-6 md:gap-4 md:px-14 lg:grid-cols-4">
        {RESTAURANTE.galeria.map((foto, i) => (
          <li key={foto.src}>
            <Reveal className="group relative aspect-[2/3] overflow-hidden rounded-xl bg-white/5" delay={(i % 4) * 100}>
              <button
                type="button"
                onClick={(ev) => abrir(i, ev)}
                aria-label={`Ampliar foto: ${foto.alt}`}
                aria-haspopup="dialog"
                className="absolute inset-0 block h-full w-full cursor-default"
              >
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </button>
            </Reveal>
          </li>
        ))}
      </ul>

      {/* Visor: se dibuja sobre <body> para quedar por encima del navbar y de cualquier contenedor de la página */}
      {abierta &&
        createPortal(
          <div
            ref={dialogoRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ampliada: ${abierta.alt}`}
            tabIndex={-1}
            onClick={(e) => e.target === e.currentTarget && cerrar()}
            className={`fixed inset-0 z-[70] flex cursor-default items-center justify-center bg-black/90 p-4 outline-none backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <p className="sr-only">Para cerrar, presioná Escape o tocá fuera de la imagen.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={abierta.src}
              alt={abierta.alt}
              draggable={false}
              className={`max-h-[84dvh] max-w-[88vw] cursor-default select-none rounded-lg object-contain shadow-2xl transition-transform duration-300 ${visible ? 'scale-100' : 'scale-95'
                }`}
            />
          </div>,
          document.body
        )}
    </section>
  );
}