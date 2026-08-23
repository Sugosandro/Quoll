/**
 * Autenticazione portale negozi (/negozio/[slug]).
 *
 * Il dataset Sanity è pubblico in lettura, quindi la password di ogni negozio
 * NON viene mai salvata in chiaro: il campo `passwordHash` sul documento
 * "negozio" contiene solo l'hash (vedi sanity/components/PasswordHashInput.tsx,
 * che la cifra al momento del salvataggio in Studio).
 *
 * Il cookie di sessione non contiene la password né il suo hash: è firmato con
 * un secret separato (NEGOZIO_SESSION_SECRET) e lega la sessione allo slug del
 * negozio, così il middleware può verificarla senza interrogare Sanity ad ogni
 * richiesta, e un negozio non può usare il proprio cookie per vedere i dati di
 * un altro negozio (lo slug nel cookie deve combaciare con quello nell'URL).
 */

const PASSWORD_SALT = 'quoll-negozio-pw-v1'
const SESSION_SALT = 'quoll-negozio-session-v1'

export const NEGOZIO_COOKIE = 'quoll_negozio'

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Hash da confrontare col campo `passwordHash` del documento negozio. */
export async function hashNegozioPassword(password: string): Promise<string> {
  return sha256Hex(`${password}:${PASSWORD_SALT}`)
}

function getSessionSecret(): string {
  return process.env.NEGOZIO_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.STUDIO_PASSWORD || ''
}

async function negozioSessionToken(slug: string): Promise<string> {
  return sha256Hex(`${slug}:${getSessionSecret()}:${SESSION_SALT}`)
}

/** Valore del cookie da impostare dopo un login riuscito per lo slug indicato. */
export async function buildNegozioCookieValue(slug: string): Promise<string> {
  return `${slug}.${await negozioSessionToken(slug)}`
}

/** Ritorna lo slug del negozio autenticato, o null se il cookie manca/non è valido. */
export async function verifyNegozioCookie(cookieValue: string | undefined | null): Promise<string | null> {
  if (!cookieValue) return null
  const sep = cookieValue.lastIndexOf('.')
  if (sep < 0) return null
  const slug = cookieValue.slice(0, sep)
  const token = cookieValue.slice(sep + 1)
  if (!slug || !token) return null
  const expected = await negozioSessionToken(slug)
  return token === expected ? slug : null
}
