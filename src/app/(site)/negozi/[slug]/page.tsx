import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getNegozioPubblicoBySlug, getMovimentiPerNegozio, getAllMiniature } from '@/sanity/lib/queries'
import { computeGiacenzaCorrente, arricchisciConPrezzo } from '@/lib/giacenza'
import { urlFor } from '@/sanity/lib/image'
import NegozioProdotti, { type RigaNegozio } from '@/components/NegozioProdotti'
import { SITE_URL } from '@/lib/siteUrl'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const negozio = await getNegozioPubblicoBySlug(slug)
  if (!negozio) return { title: 'Negozio non trovato' }
  return { title: `${negozio.nome} · Quoll`, description: `Miniature Quoll disponibili da ${negozio.nome}${negozio.indirizzo ? ` — ${negozio.indirizzo}` : ''}` }
}

export default async function NegozioPubblicoPage({ params }: PageProps) {
  const { slug } = await params
  const negozio = await getNegozioPubblicoBySlug(slug)
  if (!negozio) notFound()

  const [movimenti, miniature] = await Promise.all([
    getMovimentiPerNegozio(negozio._id),
    getAllMiniature(true),
  ])

  // "miniature" contiene solo i prodotti visibili nel catalogo: un prodotto nascosto
  // non deve comparire nemmeno nella vetrina pubblica del negozio.
  const visibiliIds = new Set(miniature.map((m) => m._id))
  const giacenze = arricchisciConPrezzo(
    computeGiacenzaCorrente(movimenti).filter((g) => g.miniatura && visibiliIds.has(g.miniatura._id)),
    miniature
  ).sort((a, b) => (b.prezzoScontato ?? b.prezzo ?? 0) - (a.prezzoScontato ?? a.prezzo ?? 0))

  // Per far scorrere tutte le foto del prodotto direttamente sulla card (come nel catalogo generale)
  const immaginiById = new Map(miniature.map((m) => [m._id, m.immagini ?? []]))
  const righe: RigaNegozio[] = giacenze.map((g) => ({
    ...g,
    immaginiUrls: (g.miniatura ? immaginiById.get(g.miniatura._id) ?? [] : [])
      .filter(Boolean)
      .map((img) => urlFor(img).width(400).height(400).fit('crop').auto('format').url()),
  }))

  // Dati strutturati Store (schema.org): sono negozi fisici reali dove le miniature
  // Quoll sono esposte dal vivo — aiuta Google ad associare il sito alla zona di Roma.
  const storeJsonLd = negozio.indirizzo
    ? {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: negozio.nome,
        address: negozio.indirizzo,
        url: `${SITE_URL}/negozi/${slug}`,
        ...(negozio.immagine ? { image: urlFor(negozio.immagine).width(800).height(800).fit('crop').auto('format').url() } : {}),
      }
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {storeJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <Link href="/negozi" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 mb-8 transition-colors shadow-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tutti i negozi
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        {negozio.immagine && (
          <div className="relative w-full sm:w-64 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-gray-100 flex-none">
            <Image
              src={urlFor(negozio.immagine).width(500).height(500).fit('crop').auto('format').url()}
              alt={negozio.nome}
              fill
              sizes="256px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{negozio.nome}</h1>
          {negozio.indirizzo && <p className="text-gray-500 mt-1">{negozio.indirizzo}</p>}
          <p className="text-sm text-gray-400 mt-3">Miniature Quoll disponibili dal vivo in questo negozio</p>
        </div>
      </div>

      {righe.length === 0 ? (
        <p className="text-gray-400">Nessun pezzo disponibile al momento in questo negozio.</p>
      ) : (
        <NegozioProdotti giacenze={righe} />
      )}
    </div>
  )
}
