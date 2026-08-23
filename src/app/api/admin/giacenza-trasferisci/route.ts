import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'

/** Sposta una quantità di un prodotto da un negozio a un altro: due movimenti in una sola transazione. */
export async function POST(req: Request) {
  let body: {
    fromNegozioId?: unknown
    toNegozioId?: unknown
    miniaturaId?: unknown
    varianteNome?: unknown
    quantita?: unknown
    fromNegozioSlug?: unknown
    toNegozioSlug?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }

  const { fromNegozioId, toNegozioId, miniaturaId, varianteNome, quantita, fromNegozioSlug, toNegozioSlug } = body
  if (typeof fromNegozioId !== 'string' || !fromNegozioId || typeof toNegozioId !== 'string' || !toNegozioId) {
    return NextResponse.json({ error: 'Negozi mancanti' }, { status: 400 })
  }
  if (fromNegozioId === toNegozioId) {
    return NextResponse.json({ error: 'Negozio di partenza e destinazione coincidono' }, { status: 400 })
  }
  if (typeof miniaturaId !== 'string' || !miniaturaId) {
    return NextResponse.json({ error: 'Miniatura mancante' }, { status: 400 })
  }
  if (typeof quantita !== 'number' || !Number.isInteger(quantita) || quantita < 1) {
    return NextResponse.json({ error: 'Quantità non valida' }, { status: 400 })
  }
  if (varianteNome != null && typeof varianteNome !== 'string') {
    return NextResponse.json({ error: 'Variante non valida' }, { status: 400 })
  }
  if (!process.env.SANITY_API_TOKEN) {
    return NextResponse.json({ error: 'token di scrittura non configurato' }, { status: 500 })
  }

  const [fromNegozio, toNegozio] = await Promise.all([
    client.withConfig({ useCdn: false }).fetch<{ nome: string } | null>(`*[_id == $id][0]{ nome }`, { id: fromNegozioId }),
    client.withConfig({ useCdn: false }).fetch<{ nome: string } | null>(`*[_id == $id][0]{ nome }`, { id: toNegozioId }),
  ])
  if (!fromNegozio || !toNegozio) {
    return NextResponse.json({ error: 'Negozio non trovato' }, { status: 404 })
  }

  const now = new Date().toISOString()
  await writeClient
    .transaction()
    .create({
      _type: 'movimentoGiacenza',
      negozio: { _type: 'reference', _ref: fromNegozioId },
      miniatura: { _type: 'reference', _ref: miniaturaId },
      varianteNome: varianteNome || undefined,
      quantita: -quantita,
      motivo: 'ritiro',
      data: now,
      note: `Trasferito a ${toNegozio.nome}`,
    })
    .create({
      _type: 'movimentoGiacenza',
      negozio: { _type: 'reference', _ref: toNegozioId },
      miniatura: { _type: 'reference', _ref: miniaturaId },
      varianteNome: varianteNome || undefined,
      quantita,
      motivo: 'consegna',
      data: now,
      note: `Trasferito da ${fromNegozio.nome}`,
    })
    .commit()

  if (typeof fromNegozioSlug === 'string' && fromNegozioSlug) {
    revalidatePath(`/admin/negozi/${fromNegozioSlug}`)
    revalidatePath(`/negozio/${fromNegozioSlug}`)
  }
  if (typeof toNegozioSlug === 'string' && toNegozioSlug) {
    revalidatePath(`/admin/negozi/${toNegozioSlug}`)
    revalidatePath(`/negozio/${toNegozioSlug}`)
  }
  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true })
}
