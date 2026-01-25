import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const middleware = async (request: NextRequest) => {
  const sessionCookie = request.cookies.get('session')?.value;
  const emailVerifiedCookie = request.cookies.get('emailVerified')?.value;

  const isAuthenticated = !!sessionCookie;
  const emailVerified = emailVerifiedCookie === 'true';

  const isOnLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isOnVerifyPage = request.nextUrl.pathname.startsWith('/verify');
  const isOnApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Allow API routes to handle their own auth
  if (isOnApiRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isOnLoginPage && !isOnVerifyPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated and verified users away from login/verify pages
  if (isAuthenticated && emailVerified) {
    if (isOnLoginPage || isOnVerifyPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect authenticated but unverified users to verify page
  // unless the cookie is missing (undefined) but session exists, then allow through to handle race condition during guest login
  if (isAuthenticated && !emailVerified && emailVerifiedCookie !== undefined) {
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
