import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'
import { NEGOZIO_COOKIE, verifyNegozioCookie } from '@/lib/negozioAuth'

interface ItemInput {
  miniaturaId?: unknown
  varianteNome?: unknown
  quantita?: unknown
  prezzoStimato?: unknown
  offertaUsata?: unknown
  scontoExtra?: unknown
  note?: unknown
}

interface ItemValido {
  miniaturaId: string
  varianteNome?: string
  quantita: number
  prezzoStimato?: number
  offertaUsata: boolean
  scontoExtra?: number
  note?: string
}

function validaItem(item: unknown): ItemValido | string {
  if (typeof item !== 'object' || item === null) return 'Riga non valida'
  const { miniaturaId, varianteNome, quantita, prezzoStimato, offertaUsata, scontoExtra, note } = item as ItemInput

  if (typeof miniaturaId !== 'string' || !miniaturaId) return 'Miniatura mancante'
  if (typeof quantita !== 'number' || !Number.isInteger(quantita) || quantita < 1) return 'Quantità non valida'
  if (prezzoStimato != null && (typeof prezzoStimato !== 'number' || !isFinite(prezzoStimato) || prezzoStimato < 0))
    return 'Prezzo non valido'
  if (scontoExtra != null && (typeof scontoExtra !== 'number' || !isFinite(scontoExtra) || scontoExtra < 0))
    return 'Sconto non valido'
  if (offertaUsata != null && typeof offertaUsata !== 'boolean') return 'Valore offerta non valido'
  if (varianteNome != null && typeof varianteNome !== 'string') return 'Variante non valida'
  if (note != null && typeof note !== 'string') return 'Note non valide'

  return {
    miniaturaId,
    varianteNome: varianteNome || undefined,
    quantita,
    prezzoStimato: prezzoStimato ?? undefined,
    offertaUsata: offertaUsata ?? false,
    scontoExtra: scontoExtra ?? undefined,
    note: note || undefined,
  }
}

export async function POST(req: Request) {
  // Il proxy ha già verificato che il cookie sia valido; qui lo rileggiamo per
  // sapere DI QUALE negozio si tratta — non ci fidiamo di un negozioId inviato dal client.
  const cookieStore = await cookies()
  const slug = await verifyNegozioCookie(cookieStore.get(NEGOZIO_COOKIE)?.value)
  if (!slug) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  let body: { items?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Nessun prodotto da segnalare' }, { status: 400 })
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: 'Troppi prodotti in una sola segnalazione' }, { status: 400 })
  }

  const items: ItemValido[] = []
  for (const raw of body.items) {
    const risultato = validaItem(raw)
    if (typeof risultato === 'string') {
      return NextResponse.json({ error: risultato }, { status: 400 })
    }
    items.push(risultato)
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
  const miniaturaIds = [...new Set(items.map((i) => i.miniaturaId))]
  const miniature = await client.withConfig({ useCdn: false }).fetch<
    { _id: string; varianti: { nome: string; prezzo?: number }[] }[]
  >(`*[_id in $ids]{ _id, varianti }`, { ids: miniaturaIds })
  const variantiById = new Map(miniature.map((m) => [m._id, m.varianti ?? []]))

  const now = new Date().toISOString()
  let tx = writeClient.transaction()
  for (const item of items) {
    const varianti = variantiById.get(item.miniaturaId) ?? []
    const variante = item.varianteNome ? varianti.find((v) => v.nome === item.varianteNome) : undefined
    tx = tx.create({
      _type: 'venditaSegnalata',
      negozio: { _type: 'reference', _ref: negozio._id },
      miniatura: { _type: 'reference', _ref: item.miniaturaId },
      varianteNome: item.varianteNome,
      quantita: item.quantita,
      prezzoListino: variante?.prezzo,
      prezzoStimato: item.prezzoStimato,
      offertaUsata: item.offertaUsata,
      scontoExtra: item.scontoExtra,
      note: item.note,
      data: now,
      stato: 'segnalata',
    })
  }
  await tx.commit()

  revalidatePath(`/negozio/${slug}`)
  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true, count: items.length })
}

/**
 * Il negozio può ritirare una PROPRIA segnalazione, ma solo finché è ancora
 * "da revisionare" — una volta confermata in ordine ufficiale (e quindi già
 * scalata dalla giacenza), solo l'admin può eliminarla da /admin/negozi.
 */
export async function DELETE(req: Request) {
  const cookieStore = await cookies()
  const slug = await verifyNegozioCookie(cookieStore.get(NEGOZIO_COOKIE)?.value)
  if (!slug) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  let id: unknown
  try {
    ;({ id } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'id mancante' }, { status: 400 })
  }
  if (!process.env.SANITY_API_TOKEN) {
    return NextResponse.json({ error: 'token di scrittura non configurato' }, { status: 500 })
  }

  const negozio = await client
    .withConfig({ useCdn: false })
    .fetch<{ _id: string } | null>(`*[_type == "negozio" && slug.current == $slug][0]{ _id }`, { slug })
  if (!negozio) {
    return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
  }

  const segnalazione = await client
    .withConfig({ useCdn: false })
    .fetch<{ _id: string; stato: string; negozio?: { _ref: string } } | null>(
      `*[_type == "venditaSegnalata" && _id == $id][0]{ _id, stato, negozio }`,
      { id }
    )
  if (!segnalazione) {
    return NextResponse.json({ error: 'Segnalazione non trovata' }, { status: 404 })
  }
  // Non ci fidiamo di un negozioId inviato dal client: verifichiamo che la
  // segnalazione appartenga davvero al negozio autenticato da questo cookie.
  if (segnalazione.negozio?._ref !== negozio._id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }
  if (segnalazione.stato !== 'segnalata') {
    return NextResponse.json({ error: 'Non puoi ritirare una segnalazione già confermata' }, { status: 409 })
  }

  await writeClient.delete(id)

  revalidatePath(`/negozio/${slug}`)
  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true })
}
