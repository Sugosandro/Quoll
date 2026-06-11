import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // Proteggi /studio solo in produzione
  if (process.env.NODE_ENV !== 'production') return NextResponse.next()

  const user = process.env.STUDIO_USERNAME
  const pass = process.env.STUDIO_PASSWORD

  if (!user || !pass) return NextResponse.next()

  const authHeader = request.headers.get('authorization')

  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6))
    const [inputUser, inputPass] = decoded.split(':')
    if (inputUser === user && inputPass === pass) return NextResponse.next()
  }

  return new NextResponse('Accesso non autorizzato', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Studio"' },
  })
}

export const config = {
  matcher: ['/studio/:path*', '/admin/:path*', '/admin'],
}
