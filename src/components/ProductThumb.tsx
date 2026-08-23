import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import type { MiniaturaRef } from '@/types/negozio'

interface ProductThumbProps {
  miniatura?: MiniaturaRef
  varianteNome?: string
}

/** Miniatura + variante con thumbnail e link al catalogo, riusata nelle pagine negozio/admin. */
export default function ProductThumb({ miniatura, varianteNome }: ProductThumbProps) {
  const href = miniatura?.slug?.current ? `/miniature/${miniatura.slug.current}` : null

  const content = (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-none">
        {miniatura?.immagine && (
          <Image
            src={urlFor(miniatura.immagine).width(72).height(72).fit('crop').auto('format').url()}
            alt={miniatura.nome}
            fill
            sizes="36px"
            className="object-cover"
          />
        )}
      </span>
      <span className="text-gray-700 truncate">
        {miniatura?.nome ?? 'Miniatura'}
        {varianteNome && <span className="text-gray-400"> — {varianteNome}</span>}
      </span>
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
      {content}
    </Link>
  )
}
