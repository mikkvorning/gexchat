import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const middleware = (request: NextRequest) => {
  const isAuthenticated = request.cookies.has('session');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isVerifyEmailPage =
    request.nextUrl.pathname.startsWith('/verify-email');

  if (!isAuthenticated && !isLoginPage && !isVerifyEmailPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
};

export default middleware;

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
