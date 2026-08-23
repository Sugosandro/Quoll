import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { writeClient } from '@/sanity/lib/writeClient'

/**
 * Elimina una vendita segnalata (es. una prova fatta in test). Elimina solo
 * questo documento: se era già stata confermata, l'ordine ufficiale e l'eventuale
 * movimento di giacenza collegati restano — vanno rimossi a parte se necessario.
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

  await writeClient.delete(id)

  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true })
}
