import Link from 'next/link'
import Image from 'next/image'
import { getNegoziPubblici } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 300

export const metadata = {
  title: 'Dove trovarci a Roma · Quoll',
  description: 'I negozi di Roma dove trovare dal vivo le miniature Quoll per D&D e tabletop.',
}

export default async function NegoziPage() {
  const negozi = await getNegoziPubblici()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dove trovarci a Roma</h1>
        <p className="text-gray-500 mt-1">I negozi di Roma che espongono le miniature Quoll dal vivo</p>
      </div>

      {negozi.length === 0 ? (
        <p className="text-gray-400">Per ora nessun negozio pubblico — torna presto a controllare.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {negozi.map((n) => (
            <Link
              key={n._id}
              href={`/negozi/${n.slug.current}`}
              className="group rounded-2xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg hover:border-indigo-200 transition-all"
            >
              <div className="relative aspect-video bg-gray-100">
                {n.immagine ? (
                  <Image
                    src={urlFor(n.immagine).width(600).height(340).fit('crop').auto('format').url()}
                    alt={n.nome}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1h-4.5a1 1 0 01-1-1v-5.25h-3V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{n.nome}</h2>
                {n.indirizzo && <p className="text-sm text-gray-400 mt-1">{n.indirizzo}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
