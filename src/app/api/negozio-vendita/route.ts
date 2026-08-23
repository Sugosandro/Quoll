import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'
import { NEGOZIO_COOKIE, verifyNegozioCookie } from '@/lib/negozioAuth'

export async function POST(req: Request) {
  // Il proxy ha già verificato che il cookie sia valido; qui lo rileggiamo per
  // sapere DI QUALE negozio si tratta — non ci fidiamo di un negozioId inviato dal client.
  const cookieStore = await cookies()
  const slug = await verifyNegozioCookie(cookieStore.get(NEGOZIO_COOKIE)?.value)
  if (!slug) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  let body: {
    miniaturaId?: unknown
    varianteNome?: unknown
    quantita?: unknown
    prezzoStimato?: unknown
    offertaUsata?: unknown
    scontoExtra?: unknown
    note?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }

  const { miniaturaId, varianteNome, quantita, prezzoStimato, offertaUsata, scontoExtra, note } = body
  if (typeof miniaturaId !== 'string' || !miniaturaId) {
    return NextResponse.json({ error: 'Miniatura mancante' }, { status: 400 })
  }
  if (typeof quantita !== 'number' || !Number.isInteger(quantita) || quantita < 1) {
    return NextResponse.json({ error: 'Quantità non valida' }, { status: 400 })
  }
  if (prezzoStimato != null && (typeof prezzoStimato !== 'number' || !isFinite(prezzoStimato) || prezzoStimato < 0)) {
    return NextResponse.json({ error: 'Prezzo non valido' }, { status: 400 })
  }
  if (scontoExtra != null && (typeof scontoExtra !== 'number' || !isFinite(scontoExtra) || scontoExtra < 0)) {
    return NextResponse.json({ error: 'Sconto non valido' }, { status: 400 })
  }
  if (offertaUsata != null && typeof offertaUsata !== 'boolean') {
    return NextResponse.json({ error: 'Valore offerta non valido' }, { status: 400 })
  }
  if (varianteNome != null && typeof varianteNome !== 'string') {
    return NextResponse.json({ error: 'Variante non valida' }, { status: 400 })
  }
  if (note != null && typeof note !== 'string') {
    return NextResponse.json({ error: 'Note non valide' }, { status: 400 })
  }

  const negozio = await client
    .withConfig({ useCdn: false })
    .fetch<{ _id: string } | null>(`*[_type == "negozio" && slug.current == $slug][0]{ _id }`, { slug })
  if (!negozio) {
    return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
  }
  if (!process.env.SANITY_API_TOKEN) {
    return NextResponse.json({ error: 'token di scrittura non configurato' }, { status: 500 })
  }

  // Il prezzo di listino è calcolato lato server dal valore attuale della variante
  // (non da quello inviato dal client) — è uno snapshot per confronto, non un dato modificabile dal negozio.
  let prezzoListino: number | undefined
  if (varianteNome) {
    const varianti = await client
      .withConfig({ useCdn: false })
      .fetch<{ nome: string; prezzo?: number; prezzoScontato?: number }[]>(
        `*[_id == $id][0].varianti[]`,
        { id: miniaturaId }
      )
    const variante = (varianti ?? []).find((v) => v.nome === varianteNome)
    prezzoListino = variante?.prezzo
  }

  await writeClient.create({
    _type: 'venditaSegnalata',
    negozio: { _type: 'reference', _ref: negozio._id },
    miniatura: { _type: 'reference', _ref: miniaturaId },
    varianteNome: varianteNome || undefined,
    quantita,
    prezzoListino,
    prezzoStimato: prezzoStimato ?? undefined,
    offertaUsata: offertaUsata ?? false,
    scontoExtra: scontoExtra ?? undefined,
    note: note || undefined,
    data: new Date().toISOString(),
    stato: 'segnalata',
  })

  revalidatePath(`/negozio/${slug}`)
  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true })
}
