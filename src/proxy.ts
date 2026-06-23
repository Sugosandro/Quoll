import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, expectedToken } from '@/lib/adminAuth'

/**
 * Protegge la dashboard /admin e la API /api/ordine con un cookie di sessione.
 * La pagina di login e la sua API restano accessibili. Lo /studio è gestito
 * dall'autenticazione di Sanity (login Google), quindi non passa da qui.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // La pagina di login è sempre accessibile
  if (pathname === '/admin/login') return NextResponse.next()

  const expected = await expectedToken()
  // Se nessuna password è configurata sul server, non bloccare (evita lockout)
  if (!expected) return NextResponse.next()

  const token = request.cookies.get(ADMIN_COOKIE)?.value
  if (token && token === expected) return NextResponse.next()

  // Non autenticato
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/ordine'],
}
