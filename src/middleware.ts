import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from './app/login/actions';

// Rutas que no requieren autenticación
const publicPaths = ['/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Si es una ruta pública o un archivo estático, no hacer nada
  if (publicPaths.includes(path) || path.startsWith('/_next/') || path.startsWith('/imagenes/') || path.includes('.')) {
    return NextResponse.next();
  }
  
  const session = await getSession();

  // Si no hay sesión y la ruta no es pública, redirigir a login
  if (!session) {
    console.log(`No session found for path: ${path}. Redirecting to login.`);
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay sesión y el usuario intenta acceder a la página de login, redirigirlo a la página principal
  if (session && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si es la ruta de admin, verificar que el usuario sea ADMIN
  if (path.startsWith('/admin')) {
      if (session.razonSocial.toUpperCase() !== 'ADMIN') {
        console.log(`User ${session.razonSocial} tried to access admin page. Redirecting to home.`);
        return NextResponse.redirect(new URL('/', request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  // Coincidir con todas las rutas excepto las rutas de la API, RPC, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|imagenes|RCV|BASES DE DATOS|Poblacion 2025.csv).*)'],
};
