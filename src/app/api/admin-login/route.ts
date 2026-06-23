import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, getAdminPassword, sessionToken } from '@/lib/adminAuth'

const MAX_AGE = 60 * 60 * 24 * 30 // 30 giorni

export async function POST(req: Request) {
  const expected = getAdminPassword()
  if (!expected) {
    return NextResponse.json({ error: 'Password non configurata sul server' }, { status: 500 })
  }

  let password: unknown
  try {
    ;({ password } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }

  if (typeof password !== 'string' || password !== expected) {
    return NextResponse.json({ error: 'Password errata' }, { status: 401 })
  }

  const token = await sessionToken(password)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, {
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
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
