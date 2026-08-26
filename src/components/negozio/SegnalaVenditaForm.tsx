'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { GiacenzaNegozio } from '@/types/negozio'

interface SegnalaVenditaFormProps {
  giacenze: GiacenzaNegozio[]
}

interface RigaCarrello {
  giacenzaKey: string
  quantita: number
  prezzoStimato: string
  offertaUsata: boolean
  scontoExtra: string
}

function prezzoAttivo(g: GiacenzaNegozio): number | undefined {
  return g.prezzoScontato ?? g.prezzo
}

export default function SegnalaVenditaForm({ giacenze }: SegnalaVenditaFormProps) {
  const router = useRouter()
  const options = useMemo(() => giacenze.filter((g) => g.miniatura), [giacenze])

  const [ricerca, setRicerca] = useState('')
  const [carrello, setCarrello] = useState<RigaCarrello[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const filtrate = useMemo(() => {
    const q = ricerca.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (g) =>
        (g.miniatura?.nome ?? '').toLowerCase().includes(q) ||
        (g.miniatura?.codice ?? '').toLowerCase().includes(q) ||
        (g.varianteNome ?? '').toLowerCase().includes(q)
    )
  }, [options, ricerca])

  const quantitaNelCarrello = (key: string) => carrello.find((r) => r.giacenzaKey === key)?.quantita ?? 0

  function incrementa(g: GiacenzaNegozio) {
    setCarrello((righe) => {
      const esistente = righe.find((r) => r.giacenzaKey === g._key)
      if (esistente) {
        return righe.map((r) => (r.giacenzaKey === g._key ? { ...r, quantita: r.quantita + 1 } : r))
      }
      const p = prezzoAttivo(g)
      return [
        ...righe,
        { giacenzaKey: g._key, quantita: 1, prezzoStimato: p != null ? String(p) : '', offertaUsata: false, scontoExtra: '' },
      ]
    })
    setSuccess(false)
  }

  function decrementa(key: string) {
    setCarrello((righe) =>
      righe
        .map((r) => (r.giacenzaKey === key ? { ...r, quantita: r.quantita - 1 } : r))
        .filter((r) => r.quantita > 0)
    )
  }

  function impostaQuantita(g: GiacenzaNegozio, nuovaQuantita: number) {
    setCarrello((righe) => {
      if (nuovaQuantita <= 0) return righe.filter((r) => r.giacenzaKey !== g._key)
      const esistente = righe.find((r) => r.giacenzaKey === g._key)
      if (esistente) {
        return righe.map((r) => (r.giacenzaKey === g._key ? { ...r, quantita: nuovaQuantita } : r))
      }
      const p = prezzoAttivo(g)
      return [
        ...righe,
        { giacenzaKey: g._key, quantita: nuovaQuantita, prezzoStimato: p != null ? String(p) : '', offertaUsata: false, scontoExtra: '' },
      ]
    })
    setSuccess(false)
  }

  function rimuovi(key: string) {
    setCarrello((righe) => righe.filter((r) => r.giacenzaKey !== key))
  }

  function aggiorna(key: string, campo: 'prezzoStimato' | 'scontoExtra' | 'offertaUsata', valore: string | boolean) {
    setCarrello((righe) => righe.map((r) => (r.giacenzaKey === key ? { ...r, [campo]: valore } : r)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (carrello.length === 0) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/negozio-vendita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrello.map((r) => {
            const g = options.find((o) => o._key === r.giacenzaKey)
            return {
              miniaturaId: g?.miniatura?._id,
              varianteNome: g?.varianteNome,
              quantita: r.quantita,
              prezzoStimato: r.prezzoStimato ? Number(r.prezzoStimato) : undefined,
              offertaUsata: r.offertaUsata,
              scontoExtra: r.scontoExtra ? Number(r.scontoExtra) : undefined,
              note: note || undefined,
            }
          }),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Errore durante l\'invio')
        setLoading(false)
        return
      }
      setSuccess(true)
      setCarrello([])
      setNote('')
      router.refresh()
    } catch {
      setError('Errore di rete. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Nessuna giacenza registrata per questo negozio: chiedi all&apos;admin di aggiungerla prima di poter segnalare una vendita.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mini-catalogo */}
      <div>
        <input
          type="search"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca per nome o codice…"
          className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
          {filtrate.map((g) => {
            const qty = quantitaNelCarrello(g._key)
            return (
              <div key={g._key} className="border border-gray-200 rounded-xl p-2.5 flex flex-col">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {g.miniatura?.immagine && (
                    <Image
                      src={urlFor(g.miniatura.immagine).width(200).height(200).fit('crop').auto('format').url()}
                      alt={g.miniatura.nome}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="text-xs font-medium text-gray-800 truncate">
                  {g.miniatura?.codice && (
                    <span className="text-[10px] font-mono font-semibold text-indigo-500 bg-indigo-50 rounded px-1 py-0.5 mr-1">
                      {g.miniatura.codice}
                    </span>
                  )}
                  {g.miniatura?.nome}
                </p>
                {g.varianteNome && <p className="text-[11px] text-gray-400 truncate">{g.varianteNome}</p>}
                <div className="flex items-center justify-between mt-1 mb-2">
                  {g.prezzoScontato != null ? (
                    <span className="text-xs text-gray-500">
                      <span className="line-through">€{g.prezzo}</span> <span className="font-semibold text-red-500">€{g.prezzoScontato}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-900">€{g.prezzo ?? '—'}</span>
                  )}
                  <span className="text-[10px] text-gray-400">in negozio: {g.quantita}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={() => decrementa(g._key)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-md border border-red-300 bg-red-100/70 text-red-600 hover:bg-red-200/80 disabled:opacity-30 text-base leading-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={qty}
                    onChange={(e) => impostaQuantita(g, Math.max(0, parseInt(e.target.value, 10) || 0))}
                    onFocus={(e) => e.target.select()}
                    className="w-10 text-center text-sm font-semibold text-gray-800 border border-gray-200 rounded-md py-1"
                  />
                  <button
                    type="button"
                    onClick={() => incrementa(g)}
                    className="w-7 h-7 rounded-md border border-green-300 bg-green-100/70 text-green-700 hover:bg-green-200/80 text-base leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
          {filtrate.length === 0 && <p className="text-sm text-gray-400 col-span-full text-center py-6">Nessun prodotto trovato.</p>}
        </div>
      </div>

      {/* Carrello */}
      {carrello.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Da segnalare ({carrello.length})</p>
          {carrello.map((r) => {
            const g = options.find((o) => o._key === r.giacenzaKey)
            if (!g) return null
            const haOfferta = g.prezzoScontato != null
            return (
              <div key={r.giacenzaKey} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-700 truncate">
                    {g.miniatura?.codice && (
                      <span className="text-xs font-mono font-semibold text-indigo-500 bg-indigo-50 rounded px-1 py-0.5 mr-1.5">
                        {g.miniatura.codice}
                      </span>
                    )}
                    {g.miniatura?.nome}
                    {g.varianteNome && <span className="text-gray-400"> — {g.varianteNome}</span>}
                    <span className="text-gray-400"> ×{r.quantita}</span>
                  </span>
                  <button type="button" onClick={() => rimuovi(r.giacenzaKey)} className="flex-none text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={r.prezzoStimato}
                    onChange={(e) => aggiorna(r.giacenzaKey, 'prezzoStimato', e.target.value)}
                    placeholder="Prezzo incassato €"
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={r.scontoExtra}
                    onChange={(e) => aggiorna(r.giacenzaKey, 'scontoExtra', e.target.value)}
                    placeholder="Sconto extra €"
                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs"
                  />
                </div>
                {haOfferta && (
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={r.offertaUsata}
                      onChange={(e) => aggiorna(r.giacenzaKey, 'offertaUsata', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                    />
                    Ho applicato lo sconto già attivo sul sito
                  </label>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Si applica a tutti i prodotti di questa segnalazione"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Vendita segnalata: verrà rivista dall&apos;admin.</p>}

      <button
        type="submit"
        disabled={loading || carrello.length === 0}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Invio…' : carrello.length > 1 ? `Segnala ${carrello.length} vendite` : 'Segnala vendita'}
      </button>
      <p className="text-xs text-gray-400">
        Questa segnalazione è solo informativa: l&apos;ordine ufficiale viene creato dall&apos;admin.
      </p>
    </form>
  )
}
