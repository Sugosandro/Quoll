import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'

/**
 * Elimina una vendita segnalata GIÀ CONFERMATA insieme a tutto quello che ha
 * generato: l'ordine ufficiale collegato e l'eventuale movimento di giacenza
 * (la vendita_confermata registrata al momento della conferma). Un'unica
 * transazione atomica, così non restano ordini o movimenti orfani.
 *
 * Per le segnalazioni ancora "da revisionare" (nessun ordine collegato) usa
 * invece /api/admin/vendita-segnalata, che cancella solo quel documento.
 */
export async function DELETE(req: Request) {
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
    const segnalazione = await client
      .withConfig({ useCdn: false })
      .fetch<{ _id: string; ordineCollegato?: { _ref: string } } | null>(
        `*[_type == "venditaSegnalata" && _id == $id][0]{ _id, ordineCollegato }`,
        { id }
      )
    if (!segnalazione) {
      return NextResponse.json({ error: 'Segnalazione non trovata' }, { status: 404 })
    }

    let tx = writeClient.transaction().delete(segnalazione._id)
    let ordiniEliminati = 0
    let movimentiEliminati = 0

    const ordineId = segnalazione.ordineCollegato?._ref
    if (ordineId) {
      // Il movimento non ha un riferimento vero e proprio all'ordine (solo una nota
      // testuale creata da /api/admin/converti-vendita): lo ritroviamo cercando l'id lì dentro.
      const movimenti = await client
        .withConfig({ useCdn: false })
        .fetch<{ _id: string }[]>(`*[_type == "movimentoGiacenza" && note match $pattern]{ _id }`, {
          pattern: `*${ordineId}*`,
        })
      for (const m of movimenti) {
        tx = tx.delete(m._id)
        movimentiEliminati++
      }
      tx = tx.delete(ordineId)
      ordiniEliminati = 1
    }

    await tx.commit()

    revalidatePath('/admin')
    revalidatePath('/admin/negozi')
    return NextResponse.json({ ok: true, ordiniEliminati, movimentiEliminati })
  } catch (e) {
    console.error('Errore eliminazione vendita confermata:', e)
    return NextResponse.json({ error: 'Errore server — nessuna modifica è stata salvata' }, { status: 500 })
  }
}
