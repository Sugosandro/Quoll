import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'

/**
 * Converte una vendita segnalata da un negozio in un ordine ufficiale.
 * Protetta dal proxy admin (vedi src/proxy.ts, matcher /api/admin/:path*).
 */
export async function POST(req: Request) {
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

  const segnalazione = await client.withConfig({ useCdn: false }).fetch<{
    _id: string
    stato: string
    negozio?: { _ref: string }
    miniatura?: { _ref: string }
    varianteNome?: string
    quantita: number
    prezzoStimato?: number
    data?: string
  } | null>(
    `*[_type == "venditaSegnalata" && _id == $id][0]{ _id, stato, negozio, miniatura, varianteNome, quantita, prezzoStimato, data }`,
    { id }
  )
  if (!segnalazione) {
    return NextResponse.json({ error: 'Segnalazione non trovata' }, { status: 404 })
  }
  if (segnalazione.stato === 'confermata') {
    return NextResponse.json({ error: 'Già confermata' }, { status: 409 })
  }
  if (!segnalazione.negozio || !segnalazione.miniatura) {
    return NextResponse.json({ error: 'Segnalazione incompleta' }, { status: 400 })
  }

  const ordine = await writeClient.create({
    _type: 'ordine',
    cliente: { nome: 'Cliente negozio (da segnalazione)' },
    miniatura: { _type: 'reference', _ref: segnalazione.miniatura._ref },
    varianteNome: segnalazione.varianteNome,
    prezzo: segnalazione.prezzoStimato,
    stato: 'consegnato',
    dataOrdine: segnalazione.data ?? new Date().toISOString(),
    venditaTramiteNegozio: true,
    negozio: { _type: 'reference', _ref: segnalazione.negozio._ref },
    clientePagato: false,
    note: `Creato automaticamente da una vendita segnalata dal negozio (×${segnalazione.quantita}). Verifica prezzo e dati cliente.`,
  })

  await writeClient
    .patch(segnalazione._id)
    .set({ stato: 'confermata', ordineCollegato: { _type: 'reference', _ref: ordine._id } })
    .commit()

  // Registra l'uscita dalla giacenza del negozio, così lo storico movimenti resta accurato
  // senza che tu debba ricordarti di aggiornarlo a mano.
  await writeClient.create({
    _type: 'movimentoGiacenza',
    negozio: { _type: 'reference', _ref: segnalazione.negozio._ref },
    miniatura: { _type: 'reference', _ref: segnalazione.miniatura._ref },
    varianteNome: segnalazione.varianteNome,
    quantita: -Math.abs(segnalazione.quantita),
    motivo: 'vendita_confermata',
    data: new Date().toISOString(),
    note: `Da vendita segnalata, ordine ${ordine._id}`,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true, ordineId: ordine._id })
}
