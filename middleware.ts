import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Redirect old /login to /auth/login for backward compatibility
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  
  // Get the access token from cookies
  const accessToken = req.cookies.get('sb-access-token')?.value

  // Public routes - accessible without authentication
  const publicPaths = ['/', '/auth/login', '/auth/register']
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))

  // Protected routes - require authentication
  const protectedPaths = ['/dashboard', '/employees', '/variables', '/calculation', '/history']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // Allow public routes to pass through
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Redirect to login if trying to access protected route without session
  if (isProtectedPath && !accessToken) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/employees/:path*',
    '/variables/:path*',
    '/calculation/:path*',
    '/history/:path*',
    '/auth/:path*',
  ],
}
