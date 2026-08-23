import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'

/**
 * Imposta la giacenza di un prodotto in un negozio a un valore esatto, senza
 * dover creare un documento "movimentoGiacenza" a mano da Studio: calcola la
 * differenza rispetto alla giacenza attuale (somma dei movimenti esistenti) e
 * registra un solo movimento di rettifica — così la modifica resta rapida
 * come editare un numero, ma lo storico si costruisce comunque da solo.
 */
export async function POST(req: Request) {
  let body: { negozioId?: unknown; miniaturaId?: unknown; varianteNome?: unknown; nuovaQuantita?: unknown; negozioSlug?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }

  const { negozioId, miniaturaId, varianteNome, nuovaQuantita, negozioSlug } = body
  if (typeof negozioId !== 'string' || !negozioId) {
    return NextResponse.json({ error: 'Negozio mancante' }, { status: 400 })
  }
  if (typeof miniaturaId !== 'string' || !miniaturaId) {
    return NextResponse.json({ error: 'Miniatura mancante' }, { status: 400 })
  }
  if (typeof nuovaQuantita !== 'number' || !Number.isInteger(nuovaQuantita) || nuovaQuantita < 0) {
    return NextResponse.json({ error: 'Quantità non valida' }, { status: 400 })
  }
  if (varianteNome != null && typeof varianteNome !== 'string') {
    return NextResponse.json({ error: 'Variante non valida' }, { status: 400 })
  }
  if (!process.env.SANITY_API_TOKEN) {
    return NextResponse.json({ error: 'token di scrittura non configurato' }, { status: 500 })
  }

  const varianteFilter = varianteNome ? 'varianteNome == $varianteNome' : '!defined(varianteNome)'
  const attuale = await client.withConfig({ useCdn: false }).fetch<number[]>(
    `*[_type == "movimentoGiacenza" && negozio._ref == $negozioId && miniatura._ref == $miniaturaId && ${varianteFilter}].quantita`,
    { negozioId, miniaturaId, varianteNome: varianteNome || null }
  )
  const sommaAttuale = attuale.reduce((s, q) => s + q, 0)
  const delta = nuovaQuantita - sommaAttuale

  if (delta === 0) {
    return NextResponse.json({ ok: true, invariato: true })
  }

  await writeClient.create({
    _type: 'movimentoGiacenza',
    negozio: { _type: 'reference', _ref: negozioId },
    miniatura: { _type: 'reference', _ref: miniaturaId },
    varianteNome: varianteNome || undefined,
    quantita: delta,
    motivo: sommaAttuale === 0 && delta > 0 ? 'consegna' : 'rettifica',
    data: new Date().toISOString(),
    note: 'Impostato dalla pagina di gestione negozio',
  })

  // Sincronizza con la giacenza "ultimi pezzi" online: sono gli stessi pezzi fisici,
  // quindi portarne in negozio li toglie dal conteggio online e viceversa. Si applica
  // solo alle varianti che tracciano davvero un numero limitato (disponibilita "ultimi").
  if (varianteNome) {
    const varianti = await client.withConfig({ useCdn: false }).fetch<
      { _key: string; nome: string; disponibilita?: string; quantita?: number }[]
    >(`*[_id == $id][0].varianti[]`, { id: miniaturaId })
    const variante = (varianti ?? []).find((v) => v.nome === varianteNome)
    if (variante && variante.disponibilita === 'ultimi' && typeof variante.quantita === 'number') {
      const nuovaQuantitaOnline = Math.max(0, variante.quantita - delta)
      await writeClient
        .patch(miniaturaId)
        .set({ [`varianti[_key=="${variante._key}"].quantita`]: nuovaQuantitaOnline })
        .commit()
      revalidatePath('/catalogo')
    }
  }

  if (typeof negozioSlug === 'string' && negozioSlug) {
    revalidatePath(`/admin/negozi/${negozioSlug}`)
    revalidatePath(`/negozio/${negozioSlug}`)
  }
  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true, delta })
}
