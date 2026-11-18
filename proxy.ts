import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Redirection de confort (UX) : les visiteurs sans session sont renvoyés vers la connexion
 * avant même le chargement de l'application. La vraie protection des données est assurée
 * par le backend ; AppShell revérifie la session côté client.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/employees', '/variables', '/calculation', '/history']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ancienne adresse /login conservée pour les anciens liens et favoris.
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  const hasSession = Boolean(req.cookies.get('sd-session')?.value)

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/employees/:path*', '/variables/:path*', '/calculation/:path*', '/history/:path*'],
}
