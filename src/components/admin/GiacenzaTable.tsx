'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GiacenzaNegozio } from '@/types/negozio'
import ProductThumb from '@/components/ProductThumb'

interface AltroNegozio {
  _id: string
  nome: string
  slug: { current: string }
}

interface GiacenzaTableProps {
  negozioId: string
  negozioSlug: string
  giacenze: GiacenzaNegozio[]
  altriNegozi: AltroNegozio[]
}

function RigaGiacenza({
  riga,
  negozioId,
  negozioSlug,
  altriNegozi,
}: {
  riga: GiacenzaNegozio
  negozioId: string
  negozioSlug: string
  altriNegozi: AltroNegozio[]
}) {
  const router = useRouter()
  const [valore, setValore] = useState(String(riga.quantita))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trasferisci, setTrasferisci] = useState(false)
  const [destinazione, setDestinazione] = useState(altriNegozi[0]?._id ?? '')
  const [qtaTrasferimento, setQtaTrasferimento] = useState(riga.quantita)

  const dirty = valore !== String(riga.quantita)

  async function salva() {
    const nuovaQuantita = parseInt(valore, 10)
    if (!Number.isInteger(nuovaQuantita) || nuovaQuantita < 0) {
      setError('Numero non valido')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/giacenza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negozioId,
          negozioSlug,
          miniaturaId: riga.miniatura?._id,
          varianteNome: riga.varianteNome,
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

  async function invia() {
    if (!destinazione) return
    setLoading(true)
    setError('')
    try {
      const dest = altriNegozi.find((n) => n._id === destinazione)
      const res = await fetch('/api/admin/giacenza-trasferisci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromNegozioId: negozioId,
          fromNegozioSlug: negozioSlug,
          toNegozioId: destinazione,
          toNegozioSlug: dest?.slug.current,
          miniaturaId: riga.miniatura?._id,
          varianteNome: riga.varianteNome,
          quantita: qtaTrasferimento,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Errore')
        setLoading(false)
        return
      }
      setTrasferisci(false)
      router.refresh()
    } catch {
      setError('Errore di rete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <ProductThumb miniatura={riga.miniatura} varianteNome={riga.varianteNome} />
          {(riga.prezzoScontato != null || riga.prezzo != null) && (
            <span className="text-xs text-gray-400 block mt-0.5 ml-11">
              {riga.prezzoScontato != null ? (
                <>
                  <span className="line-through">€{riga.prezzo}</span> €{riga.prezzoScontato}
                </>
              ) : (
                `€${riga.prezzo}`
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-none">
          <input
            type="number"
            min={0}
            step={1}
            value={valore}
            onChange={(e) => setValore(e.target.value)}
            className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
          {dirty && (
            <button
              onClick={salva}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Salva'}
            </button>
          )}
          {altriNegozi.length > 0 && (
            <button
              onClick={() => setTrasferisci((v) => !v)}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              Sposta
            </button>
          )}
        </div>
      </div>
      {trasferisci && (
        <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg p-2">
          <select
            value={destinazione}
            onChange={(e) => setDestinazione(e.target.value)}
            className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-xs"
          >
            {altriNegozi.map((n) => (
              <option key={n._id} value={n._id}>
                {n.nome}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={riga.quantita}
            value={qtaTrasferimento}
            onChange={(e) => setQtaTrasferimento(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-xs text-right"
          />
          <button
            onClick={invia}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-gray-800 text-white text-xs font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Conferma'}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function GiacenzaTable({ negozioId, negozioSlug, giacenze, altriNegozi }: GiacenzaTableProps) {
  if (giacenze.length === 0) {
    return <p className="text-sm text-gray-400">Nessun prodotto assegnato a questo negozio.</p>
  }

  return (
    <div>
      {giacenze.map((riga) => (
        <RigaGiacenza key={riga._key} riga={riga} negozioId={negozioId} negozioSlug={negozioSlug} altriNegozi={altriNegozi} />
      ))}
    </div>
  )
}
