import CatalogClient from '@/components/CatalogClient'
import { getAllMiniature } from '@/sanity/lib/queries'

export const revalidate = 60

export default async function CatalogoPage() {
  const miniature = await getAllMiniature()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catalogo</h1>
        <p className="text-gray-500 mt-1">Tutte le miniature disponibili</p>
      </div>
      <CatalogClient miniature={miniature} />
    </div>
  )
}
