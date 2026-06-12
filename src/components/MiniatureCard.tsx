import Link from 'next/link'
import Image from 'next/image'
import type { MiniatureListItem, Variante } from '@/types/miniatura'
import { urlFor } from '@/sanity/lib/image'

interface MiniatureCardProps {
  miniatura: MiniatureListItem
}

const NOVITA_GIORNI = 14

function isNuovo(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) < NOVITA_GIORNI * 86400_000
}

function isValidSconto(v: Variante): boolean {
  if (v.prezzoScontato == null || v.prezzoScontato >= v.prezzo) return false
  if (!v.scadenzaSconto) return true
  return new Date(v.scadenzaSconto) > new Date()
}

function formatScadenza(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'Scade tra < 1h'
  if (hours < 48) return `Scade tra ${hours}h`
  if (days < 7) return `Scade tra ${days}g ${Math.floor((diff - days * 86400000) / 3600000)}h`
  const d = new Date(iso)
  return `Scade il ${d.getDate()}/${d.getMonth() + 1}`
}

export default function MiniatureCard({ miniatura }: MiniatureCardProps) {
  const { nome, slug, immagini, scala, genere, varianti, _createdAt, bestSeller } = miniatura
  const nuovo = isNuovo(_createdAt)

  const variantiDisponibili = varianti?.filter((v) => v.disponibilita !== 'esaurito') ?? []
  const tutteEsaurite = (varianti?.length ?? 0) > 0 && variantiDisponibili.length === 0
  const haUltimiPezzi = variantiDisponibili.some((v) => v.disponibilita === 'ultimi')

  // Prezzo minimo considerando solo sconti validi
  const prezzoMinimo = variantiDisponibili
    .map((v) => isValidSconto(v) ? v.prezzoScontato! : v.prezzo)
    .reduce<number | null>((min, p) => (min === null || p < min ? p : min), null)

  // Prezzo originale corrispondente (per mostrare il barrato)
  const prezzoOriginale = variantiDisponibili
    .filter((v) => isValidSconto(v))
    .map((v) => v.prezzo)
    .reduce<number | null>((min, p) => (min === null || p < min ? p : min), null)

  // Sconto percentuale massimo tra varianti con sconto valido
  const maxSconto = variantiDisponibili.reduce<number | null>((max, v) => {
    if (!isValidSconto(v)) return max
    const pct = Math.round((1 - v.prezzoScontato! / v.prezzo) * 100)
    return max === null || pct > max ? pct : max
  }, null)

  // Prima scadenza disponibile tra le varianti in sconto
  const primaScadenza = variantiDisponibili
    .filter((v) => isValidSconto(v) && v.scadenzaSconto)
    .map((v) => v.scadenzaSconto!)
    .sort()[0] ?? null

  const imageUrl = immagini?.[0]
    ? urlFor(immagini[0]).width(600).height(600).fit('crop').auto('format').url()
    : null

  return (
    <Link
      href={`/miniature/${slug.current}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-indigo-100/70 hover:border-indigo-200 hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative aspect-square bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge sinistra */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {bestSeller && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              Best Seller
            </span>
          )}
          {nuovo && !bestSeller && (
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
              Novità
            </span>
          )}
          {genere && (
            <span className="bg-white/90 backdrop-blur text-xs font-medium px-2 py-1 rounded-full text-indigo-700">
              {genere}
            </span>
          )}
        </div>

        {/* Badge destra — sconto + scadenza + stock */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {tutteEsaurite && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Esaurito
            </span>
          )}
          {!tutteEsaurite && haUltimiPezzi && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Ultimi pezzi
            </span>
          )}
          {maxSconto !== null && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{maxSconto}%
            </span>
          )}
          {primaScadenza && (
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              {formatScadenza(primaScadenza)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
          {nome}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          {scala && (Array.isArray(scala) ? scala : [scala]).length > 0 && (
            <span className="text-xs text-gray-400">{(Array.isArray(scala) ? scala : [scala]).join(' · ')}</span>
          )}
          {prezzoMinimo !== null ? (
            <div className="flex items-baseline gap-1.5 ml-auto">
              {prezzoOriginale !== null && (
                <span className="text-xs text-gray-400 line-through">
                  €{prezzoOriginale.toFixed(2)}
                </span>
              )}
              <span className={`text-sm font-bold ${prezzoOriginale !== null ? 'text-red-500' : 'text-indigo-600'}`}>
                da €{prezzoMinimo.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400 ml-auto">Prezzo su richiesta</span>
          )}
        </div>
      </div>
    </Link>
  )
}
