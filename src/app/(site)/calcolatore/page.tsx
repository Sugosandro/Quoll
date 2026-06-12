import type { Metadata } from 'next'
import CalcolatorePublicoClient from '@/components/CalcolatorePublicoClient'
import { getProfiliPrezzo, getSiteSettings } from '@/sanity/lib/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Stima prezzo · Quoll',
  description: 'Carica il tuo file STL e ottieni una stima indicativa del prezzo di stampa.',
}

export default async function CalcolatorePage() {
  const [profili, settings] = await Promise.all([
    getProfiliPrezzo(true),
    getSiteSettings(),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Stima prezzo di stampa</h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Carica il file STL del tuo modello per ottenere una stima indicativa. Il file viene analizzato direttamente nel tuo browser — non viene inviato a nessun server.
        </p>
      </div>
      <CalcolatorePublicoClient profili={profili} percentualeNegozio={settings?.percentualeNegozio ?? 0} />
    </div>
  )
}
