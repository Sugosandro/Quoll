'use client'

import { useState, useMemo } from 'react'
import MiniatureCard from './MiniatureCard'
import AnimateIn from './AnimateIn'
import SiteBanner from './SiteBanner'
import type { MiniatureListItem } from '@/types/miniatura'

const NOVITA_GIORNI = 14

function toArr(scala?: string | string[]): string[] {
  if (!scala) return []
  return Array.isArray(scala) ? scala : [scala]
}

function isNuovo(createdAt: string) {
  return (Date.now() - new Date(createdAt).getTime()) < NOVITA_GIORNI * 86400_000
}

function hasValidSconto(varianti?: MiniatureListItem['varianti']): boolean {
  if (!varianti) return false
  return varianti.some((v) => {
    if (v.prezzoScontato == null || v.prezzoScontato >= v.prezzo) return false
    if (!v.scadenzaSconto) return true
    return new Date(v.scadenzaSconto) > new Date()
  })
}

function minPrezzo(varianti?: MiniatureListItem['varianti']): number {
  if (!varianti) return Infinity
  const prezzi = varianti
    .filter((v) => v.disponibilita !== 'esaurito')
    .map((v) => v.prezzo)
  return prezzi.length ? Math.min(...prezzi) : Infinity
}

type SortKey = 'recenti' | 'prezzo-asc' | 'prezzo-desc' | 'nome'

interface CatalogClientProps {
  miniature: MiniatureListItem[]
}

export default function CatalogClient({ miniature }: CatalogClientProps) {
  const [query, setQuery] = useState('')
  const [activeGenere, setGenere] = useState<string | null>(null)
  const [activeTipo, setTipo] = useState<string | null>(null)
  const [activeScala, setScala] = useState<string | null>(null)
  const [soloNovita, setSoloNovita] = useState(false)
  const [soloOfferta, setSoloOfferta] = useState(false)
  const [sort, setSort] = useState<SortKey>('recenti')

  const generi = useMemo(
    () => [...new Set(miniature.map((m) => m.genere).filter(Boolean) as string[])].sort(),
    [miniature]
  )
  const tipi = useMemo(
    () => [...new Set(miniature.map((m) => m.tipo).filter(Boolean) as string[])].sort(),
    [miniature]
  )
  const scale = useMemo(
    () => [...new Set(miniature.flatMap((m) => toArr(m.scala)))].sort(),
    [miniature]
  )

  const hasFilters = !!(activeGenere || activeTipo || activeScala || soloNovita || soloOfferta || query.trim())

  const filtered = useMemo(() => {
    let result = [...miniature]
    const q = query.trim().toLowerCase()
    if (q) result = result.filter((m) =>
      m.nome.toLowerCase().includes(q) ||
      (m.genere ?? '').toLowerCase().includes(q) ||
      (m.tipo ?? '').toLowerCase().includes(q)
    )
    if (activeGenere) result = result.filter((m) => m.genere === activeGenere)
    if (activeTipo) result = result.filter((m) => m.tipo === activeTipo)
    if (activeScala) result = result.filter((m) => toArr(m.scala).includes(activeScala))
    if (soloNovita) result = result.filter((m) => isNuovo(m._createdAt))
    if (soloOfferta) result = result.filter((m) => hasValidSconto(m.varianti))

    result.sort((a, b) => {
      if (sort === 'recenti') return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
      if (sort === 'nome') return a.nome.localeCompare(b.nome, 'it')
      if (sort === 'prezzo-asc') return minPrezzo(a.varianti) - minPrezzo(b.varianti)
      if (sort === 'prezzo-desc') return minPrezzo(b.varianti) - minPrezzo(a.varianti)
      return 0
    })

    return result
  }, [miniature, query, activeGenere, activeTipo, activeScala, soloNovita, soloOfferta, sort])

  const clearAll = () => {
    setQuery('')
    setGenere(null)
    setTipo(null)
    setScala(null)
    setSoloNovita(false)
    setSoloOfferta(false)
    setSort('recenti')
  }

  function toggle<T>(current: T | null, value: T, setter: (v: T | null) => void) {
    setter(current === value ? null : value)
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
        : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
    }`

  const quickChip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
      active
        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
    }`

  return (
    <div className="space-y-5">
      <SiteBanner />
      {/* Search + Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Cerca per nome, genere, tipo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition cursor-pointer"
        >
          <option value="recenti">Più recenti</option>
          <option value="prezzo-asc">Prezzo crescente</option>
          <option value="prezzo-desc">Prezzo decrescente</option>
          <option value="nome">Nome A–Z</option>
        </select>
      </div>

      {/* Filter chips */}
      <div className="space-y-3 pb-5 border-b border-gray-100">
        {/* Quick toggles */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSoloNovita((v) => !v)} className={quickChip(soloNovita)}>
            Novità
          </button>
          <button onClick={() => setSoloOfferta((v) => !v)} className={quickChip(soloOfferta)}>
            In offerta
          </button>
        </div>

        {generi.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 w-14 shrink-0">Genere</span>
            {generi.map((g) => (
              <button key={g} onClick={() => toggle(activeGenere, g, setGenere)} className={chip(activeGenere === g)}>
                {g}
              </button>
            ))}
          </div>
        )}

        {tipi.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 w-14 shrink-0">Tipo</span>
            {tipi.map((t) => (
              <button key={t} onClick={() => toggle(activeTipo, t, setTipo)} className={chip(activeTipo === t)}>
                {t}
              </button>
            ))}
          </div>
        )}

        {scale.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 w-14 shrink-0">Scala</span>
            {scale.map((s) => (
              <button key={s} onClick={() => toggle(activeScala, s, setScala)} className={chip(activeScala === s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count + clear */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filtered.length}</span>{' '}
          miniatur{filtered.length === 1 ? 'a' : 'e'}
          {miniature.length !== filtered.length && (
            <span className="text-gray-400"> su {miniature.length}</span>
          )}
        </p>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Rimuovi filtri
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((m, i) => (
            <AnimateIn key={m._id} delay={i * 60}>
              <MiniatureCard miniatura={m} />
            </AnimateIn>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">
          <p className="text-lg">Nessuna miniatura trovata.</p>
          <button onClick={clearAll} className="mt-2 text-sm text-indigo-500 underline">
            Rimuovi i filtri
          </button>
        </div>
      )}
    </div>
  )
}
