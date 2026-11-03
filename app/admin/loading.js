// Se muestra al instante mientras una sección del panel carga sus datos.
// Next lo usa automáticamente para todas las páginas dentro de /admin.
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Cargando…</span>

      {/* Título */}
      <div className="h-9 w-56 animate-pulse rounded-lg bg-tinta/10" />

      {/* Tarjetas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="panel space-y-3">
            <div className="size-10 animate-pulse rounded-lg bg-tinta/10" />
            <div className="h-3 w-24 animate-pulse rounded bg-tinta/10" />
            <div className="h-7 w-16 animate-pulse rounded bg-tinta/10" />
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="panel space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-tinta/10" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-tinta/[0.06]" />
        ))}
      </div>
    </div>
  );
}
