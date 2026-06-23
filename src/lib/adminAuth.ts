/**
 * Autenticazione dashboard /admin.
 * Usa solo Web Crypto + TextEncoder, così funziona sia nell'API route (Node)
 * sia nel proxy/middleware (Edge). Nessuna dipendenza Node-only.
 *
 * Il token di sessione è derivato dalla password: hash(password + SALT).
 * Così non serve configurare un secret separato: basta la password sul server.
 */

const SALT = 'quoll-admin-v1'

export const ADMIN_COOKIE = 'quoll_admin'

/** Password attesa lato server (riusa STUDIO_PASSWORD se ADMIN_PASSWORD non è impostata). */
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || process.env.STUDIO_PASSWORD || ''
}

/** Calcola il token di sessione a partire dalla password. */
export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:${SALT}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Token atteso per il confronto; null se nessuna password è configurata. */
export async function expectedToken(): Promise<string | null> {
  const pw = getAdminPassword()
  if (!pw) return null
  return sessionToken(pw)
}
