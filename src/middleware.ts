import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const middleware = (request: NextRequest) => {
  const isAuthenticated = request.cookies.has('session');

  if (!isAuthenticated && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
};

export default middleware;

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
