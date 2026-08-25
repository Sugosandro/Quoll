'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import CardGallery from './CardGallery'
import type { GiacenzaNegozio } from '@/types/negozio'

export interface RigaNegozio extends GiacenzaNegozio {
  immaginiUrls: string[]
}

export default function NegozioProdotti({ giacenze }: { giacenze: RigaNegozio[] }) {
  const [query, setQuery] = useState('')

  const filtrate = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return giacenze
    return giacenze.filter(
      (g) =>
        (g.miniatura?.nome ?? '').toLowerCase().includes(q) ||
        (g.miniatura?.codice ?? '').toLowerCase().includes(q) ||
        (g.varianteNome ?? '').toLowerCase().includes(q)
    )
  }, [giacenze, query])

  return (
    <div>
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Cerca per nome o codice…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
      </div>

      {filtrate.length === 0 ? (
        <p className="text-gray-400">Nessun prodotto trovato.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrate.map((g) => (
            <Link
              key={g._key}
              href={g.miniatura?.slug?.current ? `/miniature/${g.miniatura.slug.current}` : '#'}
              className="group rounded-2xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg hover:border-indigo-200 transition-all"
            >
              <div className="relative aspect-square bg-gray-100">
                <CardGallery images={g.immaginiUrls} alt={g.miniatura?.nome ?? ''} />
                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded-full text-gray-700 pointer-events-none z-10">
                  {g.quantita} {g.quantita === 1 ? 'pezzo' : 'pezzi'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {g.miniatura?.nome}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    {g.varianteNome}
                    {g.miniatura?.codice && (g.varianteNome ? ' · ' : '') + g.miniatura.codice}
                  </span>
                  {g.prezzoScontato != null ? (
                    <span className="text-sm text-gray-500">
                      <span className="line-through">€{g.prezzo}</span>{' '}
                      <span className="font-semibold text-red-500">€{g.prezzoScontato}</span>
                    </span>
                  ) : g.prezzo != null ? (
                    <span className="text-sm font-semibold text-gray-900">€{g.prezzo}</span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
