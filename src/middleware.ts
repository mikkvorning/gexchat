import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to decode base64 JSON cookie
function parseSessionCookie(cookie: string | undefined) {
  if (!cookie) return null;
  try {
    // If you store more than just UID, parse here
    // For now, assume cookie is UID only
    return { uid: cookie };
  } catch {
    return null;
  }
}

const middleware = (request: NextRequest) => {
  const sessionCookie = request.cookies.get('session')?.value;
  const session = parseSessionCookie(sessionCookie);
  const isAuthenticated = !!session;
  const emailVerified = request.cookies.get('emailVerified')?.value;
  const isOnLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isOnVerifyPage = request.nextUrl.pathname.startsWith('/verify');

  // Allow login and verify pages for unauthenticated users
  if (!isAuthenticated && !isOnLoginPage && !isOnVerifyPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and verified, prevent access to login and verify pages
  if (isAuthenticated && emailVerified === 'true') {
    if (isOnLoginPage || isOnVerifyPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If authenticated but not verified, only allow verify page
  if (isAuthenticated && emailVerified === 'false') {
    if (!isOnVerifyPage) {
      return NextResponse.redirect(new URL('/verify', request.url));
    }
  }

  return NextResponse.next();
};

export default middleware;

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
