import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, expectedToken } from '@/lib/adminAuth'
import { NEGOZIO_COOKIE, verifyNegozioCookie } from '@/lib/negozioAuth'

/**
 * Protegge la dashboard /admin, la API /api/ordine e il portale /negozio/[slug]
 * con un cookie di sessione ciascuno. Le pagine di login e le loro API restano
 * accessibili. Lo /studio è gestito dall'autenticazione di Sanity (login Google),
 * quindi non passa da qui.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/negozio/')) {
    return handleNegozio(request)
  }

  if (pathname === '/api/negozio-vendita') {
    const cookieVal = request.cookies.get(NEGOZIO_COOKIE)?.value
    const verifiedSlug = await verifyNegozioCookie(cookieVal)
    if (!verifiedSlug) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    return NextResponse.next()
  }

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

/**
 * Un negozio autenticato può vedere solo il proprio slug: lo slug firmato nel
 * cookie deve combaciare con quello nell'URL, non basta "un cookie valido qualsiasi".
 */
async function handleNegozio(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean) // ['negozio', slug, ...]
  const slug = segments[1]
  if (!slug) return NextResponse.next()
  if (segments[2] === 'login') return NextResponse.next()

  const cookieVal = request.cookies.get(NEGOZIO_COOKIE)?.value
  const verifiedSlug = await verifyNegozioCookie(cookieVal)
  if (verifiedSlug === slug) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/negozio/${slug}/login`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/ordine', '/api/admin/:path*', '/negozio/:path*', '/api/negozio-vendita'],
}
