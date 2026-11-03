'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Reproductor propio sobre YouTube (IFrame Player API): se oculta la interfaz de YouTube (título, barra, botones)
// y se dibujan controles de Mesa Lista. El video sigue alojado en YouTube, así que no pesa en el sitio.
//
// - Antes de tocar play solo se descarga una imagen (poster o miniatura de YouTube); la API de YouTube se carga después.
// - El iframe no recibe clics (pointer-events-none): todo se maneja con los controles de abajo.
// - Al pausar o terminar se tapa el iframe con la imagen, así no aparecen los videos sugeridos ni el título de YouTube.
// Nota: el logo/marca de YouTube puede asomar un instante (política de YouTube); para un reproductor 100% propio,
// usá el archivo .mp4 (campo `video` en lib/puntos.js).

let promesaAPI = null;
function cargarAPI() {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!promesaAPI) {
    promesaAPI = new Promise((resolve) => {
      const previo = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previo?.();
        resolve(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return promesaAPI;
}

// Franja que se recorta arriba y abajo del iframe: tiene que ser mayor que la barra de título de YouTube (~60-80 px).
const RECORTE = 'max(110px, 20%)';

const mmss = (seg = 0) => `${Math.floor(seg / 60)}:${String(Math.floor(seg % 60)).padStart(2, '0')}`;

function Icono({ d, size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z';
const PAUSA = 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z';
const VOL = 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4zm11.5 2.5a4 4 0 0 0-2-3.5v7a4 4 0 0 0 2-3.5zM13.5 4.2v2.1a6.5 6.5 0 0 1 0 11.4v2.1a8.5 8.5 0 0 0 0-15.6z';
const MUTE = 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4zm11 .9 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2.1z';
const PANTALLA = 'M5 5h5v2H7v3H5zM14 5h5v5h-2V7h-3zM5 14h2v3h3v2H5zM17 14h2v5h-5v-2h3z';
const REPETIR = 'M12 5V2L7 6.5 12 11V8a5 5 0 1 1-5 5H5a7 7 0 1 0 7-8z';

export default function VideoYoutube({ id, titulo, poster }) {
  const contenedorRef = useRef(null);
  const destinoRef = useRef(null);
  const playerRef = useRef(null);
  const [activo, setActivo] = useState(false);
  const [listo, setListo] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [silencio, setSilencio] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [puedePantalla, setPuedePantalla] = useState(false);
  const [imagen, setImagen] = useState(poster || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);

  useEffect(() => {
    setPuedePantalla(!!(document.fullscreenEnabled || document.webkitFullscreenEnabled));
    const alCambiar = () => setPantallaCompleta(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', alCambiar);
    document.addEventListener('webkitfullscreenchange', alCambiar);
    return () => {
      document.removeEventListener('fullscreenchange', alCambiar);
      document.removeEventListener('webkitfullscreenchange', alCambiar);
    };
  }, []);

  // Crea el reproductor la primera vez que se toca play
  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    cargarAPI()
      .then((YT) => {
        if (cancelado || !destinoRef.current) return;
        playerRef.current = new YT.Player(destinoRef.current, {
          videoId: id,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            cc_load_policy: 0,
          },
          events: {
            onReady: (e) => {
              setDuracion(e.target.getDuration());
              setListo(true);
              e.target.playVideo();
            },
            onStateChange: (e) => {
              const S = YT.PlayerState;
              if (e.data === S.PLAYING) {
                setReproduciendo(true);
                setTerminado(false);
                setDuracion(e.target.getDuration());
              } else if (e.data === S.PAUSED) {
                setReproduciendo(false);
              } else if (e.data === S.ENDED) {
                setReproduciendo(false);
                setTerminado(true);
                e.target.seekTo(0, true);
                e.target.pauseVideo();
              }
            },
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelado = true;
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
    };
  }, [activo, id]);

  // Avanza la barra mientras se reproduce
  useEffect(() => {
    if (!reproduciendo) return;
    const t = setInterval(() => {
      const p = playerRef.current;
      if (p?.getCurrentTime) setTiempo(p.getCurrentTime());
    }, 250);
    return () => clearInterval(t);
  }, [reproduciendo]);

  const alternar = useCallback(() => {
    const p = playerRef.current;
    if (!activo) return setActivo(true);
    if (!p || !listo) return;
    if (terminado) {
      setTiempo(0);
      p.seekTo(0, true);
    }
    reproduciendo ? p.pauseVideo() : p.playVideo();
  }, [activo, listo, reproduciendo, terminado]);

  function buscar(e) {
    const t = Number(e.target.value);
    setTiempo(t);
    playerRef.current?.seekTo(t, true);
  }

  function alternarSonido() {
    const p = playerRef.current;
    if (!p) return;
    if (silencio) p.unMute();
    else p.mute();
    setSilencio(!silencio);
  }

  function alternarPantalla() {
    const el = contenedorRef.current;
    if (!el) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  }

  // La imagen tapa el iframe antes de empezar, mientras carga, en pausa y al terminar
  const miniatura = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const tapado = !activo || !listo || !reproduciendo;
  const porcentaje = duracion ? (tiempo / duracion) * 100 : 0;

  return (
    <div
      ref={contenedorRef}
      className={`group relative w-full overflow-hidden border border-white/10 bg-black ${pantallaCompleta ? 'h-full rounded-none' : 'aspect-video rounded-2xl'}`}
    >
      {/* Reproductor de YouTube (sin clics: se controla con la barra de abajo).
          El iframe es más alto que el recuadro (RECORTE arriba y abajo): el video queda centrado y exactamente del
          tamaño del recuadro, mientras que el título, el logo y los botones de YouTube caen en las franjas
          recortadas por overflow-hidden y no se ven. */}
      {activo && (
        <div
          className="pointer-events-none absolute inset-x-0 [&_iframe]:h-full [&_iframe]:w-full"
          style={{ top: `calc(-1 * ${RECORTE})`, height: `calc(100% + 2 * ${RECORTE})` }}
        >
          <div ref={destinoRef} />
        </div>
      )}

      {/* Imagen de portada */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${tapado ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagen}
          alt=""
          loading="lazy"
          onError={() => imagen !== miniatura && setImagen(miniatura)}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Capa clicable: play/pausa en todo el video */}
      <button
        type="button"
        onClick={alternar}
        aria-label={!activo ? `Reproducir video: ${titulo}` : reproduciendo ? 'Pausar' : terminado ? 'Ver de nuevo' : 'Reproducir'}
        className="absolute inset-0 flex items-center justify-center"
      >
        {tapado && (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-110 md:h-20 md:w-20">
            {activo && !listo ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <Icono d={terminado ? REPETIR : PLAY} size={30} />
            )}
          </span>
        )}
      </button>

      {/* Barra de controles propia */}
      {activo && listo && (
        <div className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 text-white transition-opacity duration-300 ${reproduciendo ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : 'opacity-100'}`}>
          <button type="button" onClick={alternar} aria-label={reproduciendo ? 'Pausar' : 'Reproducir'} className="flex h-9 w-9 shrink-0 items-center justify-center hover:opacity-70">
            <Icono d={reproduciendo ? PAUSA : PLAY} />
          </button>
          <span className="w-10 shrink-0 text-xs tabular-nums text-white/80">{mmss(tiempo)}</span>
          <input
            type="range"
            min={0}
            max={duracion || 1}
            step="0.1"
            value={tiempo}
            onChange={buscar}
            aria-label="Progreso del video"
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
            style={{ background: `linear-gradient(to right, #fff ${porcentaje}%, rgba(255,255,255,.3) ${porcentaje}%)` }}
          />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-white/80">{mmss(duracion)}</span>
          <button type="button" onClick={alternarSonido} aria-label={silencio ? 'Activar sonido' : 'Silenciar'} className="flex h-9 w-9 shrink-0 items-center justify-center hover:opacity-70">
            <Icono d={silencio ? MUTE : VOL} />
          </button>
          {puedePantalla && (
            <button type="button" onClick={alternarPantalla} aria-label="Pantalla completa" className="flex h-9 w-9 shrink-0 items-center justify-center hover:opacity-70">
              <Icono d={PANTALLA} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}