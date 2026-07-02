import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Public paths that don't need auth
        if (
          path === '/' ||
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/api/auth') ||
          path.startsWith('/api/chat') ||
          path.startsWith('/api/widget') ||
          path.startsWith('/widget') ||
          path.startsWith('/embed.js')
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
