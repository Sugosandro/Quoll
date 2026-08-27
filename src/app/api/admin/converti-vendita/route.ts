import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'

/**
 * Converte una vendita segnalata da un negozio in un ordine ufficiale.
 * Protetta dal proxy admin (vedi src/proxy.ts, matcher /api/admin/:path*).
 *
 * Le tre scritture (ordine, stato+collegamento sulla segnalazione, movimento
 * di giacenza) vanno in un'unica transazione atomica: o vanno a buon fine
 * tutte insieme, o nessuna — niente più ordini "orfani" senza il relativo
 * movimento se un passaggio fallisce a metà.
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

  try {
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

    // Generato qui (non lasciato decidere da Sanity) così possiamo riferirci
    // allo stesso ordine sia nel patch sulla segnalazione sia nella nota del
    // movimento, pur restando tutto dentro la stessa transazione.
    const ordineId = crypto.randomUUID()

    // Il negozio segnala il prezzo PER PEZZO (è quello che vede/modifica nel form,
    // precompilato col prezzo di listino unitario) — il "prezzo concordato"
    // sull'ordine è invece il totale dell'intera vendita.
    const prezzoTotale =
      segnalazione.prezzoStimato != null ? segnalazione.prezzoStimato * segnalazione.quantita : undefined

    await writeClient
      .transaction()
      .create({
        _id: ordineId,
        _type: 'ordine',
        cliente: { nome: 'Cliente negozio (da segnalazione)' },
        miniatura: { _type: 'reference', _ref: segnalazione.miniatura._ref },
        varianteNome: segnalazione.varianteNome,
        quantita: segnalazione.quantita,
        prezzo: prezzoTotale,
        stato: 'consegnato',
        dataOrdine: segnalazione.data ?? new Date().toISOString(),
        venditaTramiteNegozio: true,
        negozio: { _type: 'reference', _ref: segnalazione.negozio._ref },
        clientePagato: false,
        note: `Creato automaticamente da una vendita segnalata dal negozio (×${segnalazione.quantita}, prezzo totale). Verifica prezzo e dati cliente.`,
      })
      .patch(segnalazione._id, (p) =>
        p.set({ stato: 'confermata', ordineCollegato: { _type: 'reference', _ref: ordineId } })
      )
      .create({
        _type: 'movimentoGiacenza',
        negozio: { _type: 'reference', _ref: segnalazione.negozio._ref },
        miniatura: { _type: 'reference', _ref: segnalazione.miniatura._ref },
        varianteNome: segnalazione.varianteNome,
        quantita: -Math.abs(segnalazione.quantita),
        motivo: 'vendita_confermata',
        data: new Date().toISOString(),
        note: `Da vendita segnalata, ordine ${ordineId}`,
      })
      .commit()

    revalidatePath('/admin')
    revalidatePath('/admin/negozi')
    return NextResponse.json({ ok: true, ordineId })
  } catch (e) {
    console.error('Errore conversione vendita segnalata:', e)
    return NextResponse.json({ error: 'Errore server durante la conversione — nessuna modifica è stata salvata' }, { status: 500 })
  }
}
