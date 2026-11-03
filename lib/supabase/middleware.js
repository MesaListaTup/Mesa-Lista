import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { puedeVerPanel } from '@/lib/roles';

// Refresca la sesión de Supabase y protege /admin (solo admin) y /perfil (el layout del panel vuelve a verificar el rol)
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;
  if (!user && (ruta.startsWith('/admin') || ruta.startsWith('/perfil'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // El panel es solo para administradores: se verifica el rol en el servidor, no alcanza con ocultar el ícono.
  // (La RLS de Supabase sigue protegiendo los datos; esto evita además que se vea el panel.)
  if (user && ruta.startsWith('/admin')) {
    const { data: perfil } = await supabase.from('users').select('rol').eq('id', user.id).single();
    if (!puedeVerPanel(perfil?.rol)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return response;
}