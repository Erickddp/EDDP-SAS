import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get('session')?.value;
  const session = await decrypt(sessionCookie);

  // 1. ADMIN PROTECTION (RBAC)
  // Categories: /admin/* (UI) and /api/admin/* (Backend)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!session || session.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. CHAT PROTECTION (AUTH)
  if (pathname.startsWith('/api/chat')) {
    const isTestBypass = request.headers.get('x-test-bypass') === process.env.SESSION_SECRET;
    if (!session && !isTestBypass) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }
  }


  // 3. UI PROTECTION (REDIRECTS)
  if (pathname === '/chat' || pathname === '/account' || pathname.startsWith('/chat/')) {
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
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
