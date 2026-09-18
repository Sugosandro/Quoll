import type { Metadata } from 'next'
import CatalogClient from '@/components/CatalogClient'
import { getAllMiniature, getDisponibilitaPubblicaPerNegozio } from '@/sanity/lib/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Catalogo miniature D&D e tabletop · Quoll',
  description: 'Sfoglia tutte le miniature 3D disponibili: personaggi, mostri, veicoli ed edifici per D&D e giochi da tavolo. Disponibili subito o su ordinazione, spedizione in tutta Italia.',
}

export default async function CatalogoPage() {
  const [miniature, disponibilitaNegozi] = await Promise.all([
    getAllMiniature(true),
    getDisponibilitaPubblicaPerNegozio(),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catalogo</h1>
        <p className="text-gray-500 mt-1">Miniature 3D per D&D e tabletop, disponibili subito o su ordinazione</p>
      </div>
      <CatalogClient miniature={miniature} disponibilitaNegozi={disponibilitaNegozi} />
    </div>
  )
}
