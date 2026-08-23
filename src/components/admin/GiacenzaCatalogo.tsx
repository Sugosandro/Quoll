'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import type { MiniatureListItem } from '@/types/miniatura'
import type { GiacenzaNegozio } from '@/types/negozio'

interface GiacenzaCatalogoProps {
  negozioId: string
  negozioSlug: string
  miniature: MiniatureListItem[]
  giacenzeAttuali: GiacenzaNegozio[]
}

function chiave(miniaturaId: string, varianteNome?: string) {
  return `${miniaturaId}::${varianteNome ?? ''}`
}

const GENERI_LABEL: Record<string, string> = {
  fantasy: 'Fantasy', 'sci-fi': 'Sci-Fi', storico: 'Storico', horror: 'Horror', moderno: 'Moderno',
}
const TIPI_LABEL: Record<string, string> = {
  personaggio: 'Personaggio', veicolo: 'Veicolo', edificio: 'Edificio', animale: 'Animale', accessorio: 'Accessorio',
}

function VarianteRow({
  negozioId,
  negozioSlug,
  miniaturaId,
  varianteNome,
  prezzo,
  prezzoScontato,
  quantitaAttuale,
}: {
  negozioId: string
  negozioSlug: string
  miniaturaId: string
  varianteNome?: string
  prezzo?: number
  prezzoScontato?: number
  quantitaAttuale: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bulk, setBulk] = useState('')
  const [error, setError] = useState('')

  async function imposta(nuovaQuantita: number) {
    if (nuovaQuantita < 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/giacenza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negozioId,
          negozioSlug,
          miniaturaId,
          varianteNome: varianteNome || undefined,
          nuovaQuantita,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Errore')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  function aggiungiBulk() {
    const n = parseInt(bulk, 10)
    if (!Number.isInteger(n) || n <= 0) return
    setBulk('')
    imposta(quantitaAttuale + n)
  }

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-700 truncate">{varianteNome || 'Prodotto singolo'}</p>
          <p className="text-xs text-gray-400">
            {prezzoScontato != null ? (
              <>
                <span className="line-through">€{prezzo}</span> €{prezzoScontato}
              </>
            ) : prezzo != null ? (
              `€${prezzo}`
            ) : (
              'prezzo n.d.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-none">
          {quantitaAttuale > 0 && <span className="text-xs font-semibold text-indigo-600 w-5 text-center">{quantitaAttuale}</span>}
          <button
            type="button"
            onClick={() => imposta(quantitaAttuale - 1)}
            disabled={loading || quantitaAttuale === 0}
            className="w-7 h-7 rounded-md border border-red-400 bg-red-300/80 text-red-800 hover:bg-red-400/90 hover:border-red-500 disabled:opacity-30 text-base leading-none"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => imposta(quantitaAttuale + 1)}
            disabled={loading}
            className="w-7 h-7 rounded-md border border-green-200 bg-green-50/50 text-green-600 hover:bg-green-100/60 hover:border-green-300 disabled:opacity-30 text-base leading-none"
          >
            +
          </button>
          <input
            type="number"
            min={1}
            placeholder="N"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            className="w-11 px-1 py-1 rounded-md border border-gray-200 text-xs text-center"
          />
          <button
            type="button"
            onClick={aggiungiBulk}
            disabled={loading || !bulk}
            className="px-2 py-1 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40"
          >
            Agg.
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 text-right">{error}</p>}
    </div>
  )
}

export default function GiacenzaCatalogo({ negozioId, negozioSlug, miniature, giacenzeAttuali }: GiacenzaCatalogoProps) {
  const [ricerca, setRicerca] = useState('')
  const [genere, setGenere] = useState('')
  const [tipo, setTipo] = useState('')
  const [soloAssegnati, setSoloAssegnati] = useState(false)

  const giacenzaMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of giacenzeAttuali) {
      if (!g.miniatura) continue
      m.set(chiave(g.miniatura._id, g.varianteNome), g.quantita)
    }
    return m
  }, [giacenzeAttuali])

  const assegnatiIds = useMemo(() => {
    const s = new Set<string>()
    for (const g of giacenzeAttuali) {
      if (g.miniatura) s.add(g.miniatura._id)
    }
    return s
  }, [giacenzeAttuali])

  const conVarianti = useMemo(() => miniature.filter((m) => (m.varianti?.length ?? 0) > 0), [miniature])

  const generiDisponibili = useMemo(
    () => Array.from(new Set(conVarianti.map((m) => m.genere).filter(Boolean))) as string[],
    [conVarianti]
  )
  const tipiDisponibili = useMemo(
    () => Array.from(new Set(conVarianti.map((m) => m.tipo).filter(Boolean))) as string[],
    [conVarianti]
  )

  const filtrate = useMemo(() => {
    const q = ricerca.trim().toLowerCase()
    return conVarianti.filter((m) => {
      if (q && !m.nome.toLowerCase().includes(q)) return false
      if (genere && m.genere !== genere) return false
      if (tipo && m.tipo !== tipo) return false
      if (soloAssegnati && !assegnatiIds.has(m._id)) return false
      return true
    })
  }, [conVarianti, ricerca, genere, tipo, soloAssegnati, assegnatiIds])

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca prodotto…"
          className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
        {generiDisponibili.length > 0 && (
          <select
            value={genere}
            onChange={(e) => setGenere(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm"
          >
            <option value="">Tutti i generi</option>
            {generiDisponibili.map((g) => (
              <option key={g} value={g}>
                {GENERI_LABEL[g] ?? g}
              </option>
            ))}
          </select>
        )}
        {tipiDisponibili.length > 0 && (
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm"
          >
            <option value="">Tutti i tipi</option>
            {tipiDisponibili.map((t) => (
              <option key={t} value={t}>
                {TIPI_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloAssegnati}
            onChange={(e) => setSoloAssegnati(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
          />
          Solo già in negozio
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[32rem] overflow-y-auto pr-1">
        {filtrate.map((m) => (
          <div key={m._id} className="border border-gray-200 rounded-xl p-3 flex gap-3">
            <Link
              href={`/miniature/${m.slug.current}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-none hover:opacity-80 transition-opacity"
            >
              {m.immagini?.[0] && (
                <Image
                  src={urlFor(m.immagini[0]).width(112).height(112).fit('crop').auto('format').url()}
                  alt={m.nome}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/miniature/${m.slug.current}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-800 truncate mb-1 block hover:text-indigo-600 transition-colors"
              >
                {m.nome}
              </Link>
              <div className="divide-y divide-gray-50">
                {(m.varianti ?? []).map((v) => (
                  <VarianteRow
                    key={v._key}
                    negozioId={negozioId}
                    negozioSlug={negozioSlug}
                    miniaturaId={m._id}
                    varianteNome={v.nome}
                    prezzo={v.prezzo}
                    prezzoScontato={v.prezzoScontato}
                    quantitaAttuale={giacenzaMap.get(chiave(m._id, v.nome)) ?? 0}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtrate.length === 0 && <p className="text-sm text-gray-400 col-span-full text-center py-6">Nessun prodotto trovato.</p>}
      </div>
    </div>
  )
}
