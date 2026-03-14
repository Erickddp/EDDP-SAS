import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /api/chat
  if (pathname.startsWith('/api/chat')) {
    const sessionCookie = request.cookies.get('session')?.value;
    const session = await decrypt(sessionCookie);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }
    
    // Check for guest limitations if needed (handled in route logic)
  }

  // Basic redirection for /chat and /account if not logged in
  if (pathname === '/chat' || pathname === '/account') {
      const sessionCookie = request.cookies.get('session')?.value;
      const session = await decrypt(sessionCookie);
      
      if (!session) {
          return NextResponse.redirect(new URL('/login', request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/chat/:path*',
    '/chat/:path*',
    '/account/:path*',
  ],
};
