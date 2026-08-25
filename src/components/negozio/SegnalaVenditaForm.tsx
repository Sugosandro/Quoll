'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GiacenzaNegozio } from '@/types/negozio'

interface SegnalaVenditaFormProps {
  giacenze: GiacenzaNegozio[]
}

function prezzoAttivo(g: GiacenzaNegozio): number | undefined {
  return g.prezzoScontato ?? g.prezzo
}

export default function SegnalaVenditaForm({ giacenze }: SegnalaVenditaFormProps) {
  const router = useRouter()
  const options = giacenze.filter((g) => g.miniatura)

  const [selectedKey, setSelectedKey] = useState(options[0]?._key ?? '')
  const [quantita, setQuantita] = useState(1)
  const [prezzoStimato, setPrezzoStimato] = useState(() => {
    const p = prezzoAttivo(options[0])
    return p != null ? String(p) : ''
  })
  const [offertaUsata, setOffertaUsata] = useState(false)
  const [scontoExtra, setScontoExtra] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const selected = options.find((g) => g._key === selectedKey)
  const haOffertaAttiva = selected?.prezzoScontato != null

  function selezionaProdotto(key: string) {
    setSelectedKey(key)
    const g = options.find((o) => o._key === key)
    const p = g ? prezzoAttivo(g) : undefined
    setPrezzoStimato(p != null ? String(p) : '')
    setOffertaUsata(false)
    setScontoExtra('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected?.miniatura) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/negozio-vendita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miniaturaId: selected.miniatura._id,
          varianteNome: selected.varianteNome || undefined,
          quantita,
          prezzoStimato: prezzoStimato ? Number(prezzoStimato) : undefined,
          offertaUsata,
          scontoExtra: scontoExtra ? Number(scontoExtra) : undefined,
          note: note || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Errore durante l\'invio')
        setLoading(false)
        return
      }
      setSuccess(true)
      setQuantita(1)
      setNote('')
      selezionaProdotto(selectedKey)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pezzo venduto</label>
        <select
          value={selectedKey}
          onChange={(e) => selezionaProdotto(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        >
          {options.map((g) => {
            const prezzoLabel =
              g.prezzoScontato != null
                ? `€${g.prezzoScontato} (scontato da €${g.prezzo})`
                : g.prezzo != null
                ? `€${g.prezzo}`
                : 'prezzo n.d.'
            return (
              <option key={g._key} value={g._key}>
                {g.miniatura?.codice ? `[${g.miniatura.codice}] ` : ''}
                {g.miniatura?.nome}
                {g.varianteNome ? ` — ${g.varianteNome}` : ''} · {prezzoLabel} (in giacenza: {g.quantita})
              </option>
            )
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantità venduta</label>
          <input
            type="number"
            min={1}
            step={1}
            value={quantita}
            onChange={(e) => setQuantita(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo incassato (€)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={prezzoStimato}
            onChange={(e) => setPrezzoStimato(e.target.value)}
            placeholder="—"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {haOffertaAttiva && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={offertaUsata}
            onChange={(e) => setOffertaUsata(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
          />
          Ho applicato lo sconto già attivo sul sito per questa variante
        </label>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sconto extra fatto (€, opzionale)</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={scontoExtra}
          onChange={(e) => setScontoExtra(e.target.value)}
          placeholder="Solo se hai scontato di più rispetto al prezzo di listino/offerta"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Vendita segnalata: verrà rivista dall&apos;admin.</p>}

      <button
        type="submit"
        disabled={loading || !selected}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Invio…' : 'Segnala vendita'}
      </button>
      <p className="text-xs text-gray-400">
        Questa segnalazione è solo informativa: l&apos;ordine ufficiale viene creato dall&apos;admin.
      </p>
    </form>
  )
}
