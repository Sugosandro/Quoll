import { NextResponse } from 'next/server'
import { client } from '@/sanity/lib/client'
import { NEGOZIO_COOKIE, hashNegozioPassword, buildNegozioCookieValue } from '@/lib/negozioAuth'

const MAX_AGE = 60 * 60 * 24 * 30 // 30 giorni

export async function POST(req: Request) {
  let slug: unknown, password: unknown
  try {
    ;({ slug, password } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }
  if (typeof slug !== 'string' || !slug || typeof password !== 'string' || !password) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
  }

  const negozio = await client.withConfig({ useCdn: false }).fetch<{ passwordHash?: string } | null>(
    `*[_type == "negozio" && slug.current == $slug && attivo == true][0]{ passwordHash }`,
    { slug }
  )
  if (!negozio?.passwordHash) {
    return NextResponse.json({ error: 'Negozio non trovato' }, { status: 401 })
  }

  const hash = await hashNegozioPassword(password)
  if (hash !== negozio.passwordHash) {
    return NextResponse.json({ error: 'Password errata' }, { status: 401 })
  }

  const cookieValue = await buildNegozioCookieValue(slug)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(NEGOZIO_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(NEGOZIO_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
