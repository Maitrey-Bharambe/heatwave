import { NextResponse } from 'next/server';

// Optimistic check only: redirects visitors without a session cookie away from
// account pages. The session itself is validated against PostgreSQL on the server
// (lib/auth.js#getCurrentUser) in every protected page and API route.
export function proxy(request) {
  if (!request.cookies.has('ciq_session')) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/favorites/:path*', '/profile/:path*'],
};
