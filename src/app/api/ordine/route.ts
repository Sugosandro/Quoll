import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { writeClient } from '@/sanity/lib/writeClient'

const BOOLEAN_FIELDS = new Set(['clientePagato'])
const NUMBER_FIELDS = new Set(['importoRicevuto'])

export async function POST(req: Request) {
  try {
    const { id, field, value } = await req.json()

    if (typeof id !== 'string' || !id.length) {
      return NextResponse.json({ error: 'id mancante' }, { status: 400 })
    }
    if (!BOOLEAN_FIELDS.has(field) && !NUMBER_FIELDS.has(field)) {
      return NextResponse.json({ error: 'campo non consentito' }, { status: 400 })
    }
    if (BOOLEAN_FIELDS.has(field) && typeof value !== 'boolean') {
      return NextResponse.json({ error: 'valore non valido' }, { status: 400 })
    }
    if (NUMBER_FIELDS.has(field) && (typeof value !== 'number' || !isFinite(value) || value < 0)) {
      return NextResponse.json({ error: 'valore non valido' }, { status: 400 })
    }
    if (!process.env.SANITY_API_TOKEN) {
      return NextResponse.json({ error: 'token di scrittura non configurato' }, { status: 500 })
    }

    await writeClient.patch(id).set({ [field]: value }).commit()
    revalidatePath('/admin')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Errore aggiornamento ordine:', e)
    return NextResponse.json({ error: 'errore server' }, { status: 500 })
  }
}
