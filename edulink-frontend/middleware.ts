import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  const pathname = req.nextUrl.pathname;
  const isLandingPage = pathname === '/';
  const isAuthCallback = pathname.startsWith('/auth/callback');
  const isResetPassword = pathname.startsWith('/auth/reset-password');
  const isAuthPage = pathname === '/auth';

  // If user is not authenticated and trying to access a protected route
  if (!session && !isLandingPage && !isAuthPage && !isAuthCallback && !isResetPassword) {
    const redirectUrl = new URL('/auth', req.url);
    if (pathname !== '/dashboard') {
      redirectUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // If user is already authenticated and visiting the login/signup page directly
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
