'use client';

import { useState } from 'react';

// Reproductor de YouTube con "carga diferida": al principio solo se descarga la miniatura (unos KB).
// El iframe de YouTube (que es lo pesado) se carga recién cuando la persona toca play.
// Usa youtube-nocookie.com, que no instala cookies hasta que se reproduce.
export default function VideoYoutube({ id, titulo }) {
  const [activo, setActivo] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      {activo ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={titulo}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" onClick={() => setActivo(true)} aria-label={`Reproducir video: ${titulo}`} className="group absolute inset-0 h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform group-hover:scale-110 md:h-20 md:w-20">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" /></svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}