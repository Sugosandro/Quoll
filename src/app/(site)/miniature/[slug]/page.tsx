import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductGallery from '@/components/ProductGallery'
import VariantSelector from '@/components/VariantSelector'
import ModelViewer from '@/components/ModelViewer'
import MiniatureCard from '@/components/MiniatureCard'
import AnimateIn from '@/components/AnimateIn'
import RichText from '@/components/RichText'
import { getMiniatura, getAllSlugs, getRelated } from '@/sanity/lib/queries'
import { getFileUrl } from '@/sanity/lib/image'

export const revalidate = 60

const GENERI_LABEL: Record<string, string> = {
  fantasy: 'Fantasy', 'sci-fi': 'Sci-Fi', storico: 'Storico', horror: 'Horror', moderno: 'Moderno',
}
const TIPI_LABEL: Record<string, string> = {
  personaggio: 'Personaggio', veicolo: 'Veicolo', edificio: 'Edificio', animale: 'Animale', accessorio: 'Accessorio',
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((s) => ({ slug: s.slug.current }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const miniatura = await getMiniatura(slug)
  if (!miniatura) return { title: 'Miniatura non trovata' }
  return {
    title: `${miniatura.nome} · Quoll`,
    description: miniatura.descrizione ?? `Miniatura stampata in 3D: ${miniatura.nome}`,
  }
}

export default async function MiniatureDetailPage({ params }: PageProps) {
  const { slug } = await params
  const miniatura = await getMiniatura(slug)

  if (!miniatura) notFound()

  const { nome, descrizione, immagini, file3d, scala, genere, tipo, videoUrls, varianti } = miniatura

  const correlati = await getRelated(slug, genere, tipo)

  const file3dUrl = file3d?.asset?._ref ? getFileUrl(file3d.asset._ref) :
                    file3d?.asset?.url ?? null

  const tags = [
    scala,
    genere ? GENERI_LABEL[genere] ?? genere : null,
    tipo ? TIPI_LABEL[tipo] ?? tipo : null,
  ].filter(Boolean) as string[]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Back link */}
      <a href="/catalogo" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 mb-8 transition-colors shadow-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Torna al catalogo
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: gallery + 3D viewer */}
        <div className="space-y-6">
          <ProductGallery immagini={immagini} nome={nome} videoUrls={videoUrls} />

          {file3dUrl && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Anteprima 3D</p>
              <ModelViewer src={file3dUrl} />
            </div>
          )}
        </div>

        {/* Right: info + variant selector */}
        <div className="space-y-6">
          <div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{nome}</h1>
            {descrizione && descrizione.length > 0 && (
              <div className="mt-4">
                <RichText value={descrizione} />
              </div>
            )}
          </div>

          {varianti && varianti.length > 0 ? (
            <VariantSelector varianti={varianti} nomeMiniatura={nome} />
          ) : (
            <a
              href={`https://wa.me/393338479871?text=${encodeURIComponent(`Ciao! Sono interessato alla miniatura "${nome}". Potete darmi più informazioni?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contattami su WhatsApp
            </a>
          )}
        </div>
      </div>
      {correlati.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-100">
          <AnimateIn distance={40}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Potrebbe interessarti anche</h2>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {correlati.map((m, i) => (
              <AnimateIn key={m._id} delay={i * 80} distance={40} scale={0.97}>
                <MiniatureCard miniatura={m} />
              </AnimateIn>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
