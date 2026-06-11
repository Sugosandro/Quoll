'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface FilterBarProps {
  generi: string[]
  tipi: string[]
}

export default function FilterBar({ generi, tipi }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeGenere = searchParams.get('genere')
  const activeTipo = searchParams.get('tipo')

  const setFilter = useCallback(
    (key: 'genere' | 'tipo', value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (params.get(key) === value) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/catalogo?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearAll = () => router.push('/catalogo')
  const hasFilters = activeGenere || activeTipo

  return (
    <div className="flex flex-wrap items-center gap-3">
      {generi.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">Genere</span>
          {generi.map((g) => (
            <button
              key={g}
              onClick={() => setFilter('genere', g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeGenere === g
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {generi.length > 0 && tipi.length > 0 && (
        <span className="text-gray-200 hidden sm:inline">|</span>
      )}

      {tipi.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1">Tipo</span>
          {tipi.map((t) => (
            <button
              key={t}
              onClick={() => setFilter('tipo', t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTipo === t
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {hasFilters && (
        <button
          onClick={clearAll}
          className="ml-auto flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rimuovi filtri
        </button>
      )}
    </div>
  )
}
