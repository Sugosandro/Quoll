import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { client } from '@/sanity/lib/client'
import { writeClient } from '@/sanity/lib/writeClient'

/**
 * Elimina un movimento di giacenza (es. per correggere un errore o una prova
 * fatta in test). Se quel movimento aveva sincronizzato la giacenza "ultimi
 * pezzi" online, annulla anche quell'aggiustamento — altrimenti il conteggio
 * online resterebbe sfasato rispetto ai movimenti realmente esistenti.
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

  const movimento = await client.withConfig({ useCdn: false }).fetch<{
    miniatura?: { _ref: string }
    varianteNome?: string
    quantita: number
    motivo: string
  } | null>(`*[_id == $id][0]{ miniatura, varianteNome, quantita, motivo }`, { id })

  if (movimento?.miniatura && movimento.varianteNome && movimento.motivo !== 'vendita_confermata') {
    const varianti = await client
      .withConfig({ useCdn: false })
      .fetch<{ _key: string; nome: string; disponibilita?: string; quantita?: number }[]>(
        `*[_id == $id][0].varianti[]`,
        { id: movimento.miniatura._ref }
      )
    const variante = (varianti ?? []).find((v) => v.nome === movimento.varianteNome)
    if (variante && variante.disponibilita === 'ultimi' && typeof variante.quantita === 'number') {
      const nuovaQuantitaOnline = Math.max(0, variante.quantita + movimento.quantita)
      await writeClient
        .patch(movimento.miniatura._ref)
        .set({ [`varianti[_key=="${variante._key}"].quantita`]: nuovaQuantitaOnline })
        .commit()
      revalidatePath('/catalogo')
    }
  }

  await writeClient.delete(id)

  revalidatePath('/admin/negozi')
  return NextResponse.json({ ok: true })
}
