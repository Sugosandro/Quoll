'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { OrdineRow } from '@/sanity/lib/queries'

const STATI = [
  { value: 'tutti', label: 'Tutti' },
  { value: 'ricevuto', label: '📥 Ricevuti' },
  { value: 'in_lavorazione', label: '⚙️ In lavorazione' },
  { value: 'pronto', label: '✅ Pronti' },
  { value: 'consegnato', label: '📦 Consegnati' },
]

const STATO_STYLE: Record<string, string> = {
  ricevuto: 'bg-gray-100 text-gray-600',
  in_lavorazione: 'bg-amber-100 text-amber-700',
  pronto: 'bg-green-100 text-green-700',
  consegnato: 'bg-indigo-100 text-indigo-700',
}

const STATO_LABEL: Record<string, string> = {
  ricevuto: '📥 Ricevuto',
  in_lavorazione: '⚙️ In lavorazione',
  pronto: '✅ Pronto',
  consegnato: '📦 Consegnato',
}

function fmt(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

interface OrdersTableProps {
  ordini: OrdineRow[]
  percentualeNegozio: number
}

type PagamentoState = Record<string, { clientePagato: boolean; importoRicevuto: number }>

export default function OrdersTable({ ordini, percentualeNegozio }: OrdersTableProps) {
  const [filtroStato, setFiltroStato] = useState('tutti')
  const [sortKey, setSortKey] = useState<'data' | 'prezzo'>('data')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pag, setPag] = useState<PagamentoState>(() =>
    Object.fromEntries(
      ordini.map((o) => [o._id, { clientePagato: !!o.clientePagato, importoRicevuto: o.importoRicevuto ?? 0 }])
    )
  )
  const [saving, setSaving] = useState<string | null>(null)
  const router = useRouter()

  // Quota che spetta a me per l'ordine (al netto della commissione se vendita tramite negozio)
  const dovuto = (o: OrdineRow) =>
    o.venditaTramiteNegozio ? (o.prezzo ?? 0) * (1 - percentualeNegozio / 100) : (o.prezzo ?? 0)

  async function save(
    id: string,
    field: 'clientePagato' | 'importoRicevuto',
    value: boolean | number,
    revert: () => void
  ) {
    setSaving(`${id}:${field}`)
    try {
      const res = await fetch('/api/ordine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      })
      if (!res.ok) throw new Error('save failed')
      router.refresh() // aggiorna i KPI calcolati lato server
    } catch {
      revert()
      alert('Errore nel salvataggio del pagamento. Riprova.')
    } finally {
      setSaving(null)
    }
  }

  function toggleClientePagato(id: string) {
    const prev = pag[id]?.clientePagato ?? false
    const next = !prev
    setPag((p) => ({ ...p, [id]: { ...p[id], clientePagato: next } }))
    save(id, 'clientePagato', next, () =>
      setPag((p) => ({ ...p, [id]: { ...p[id], clientePagato: prev } }))
    )
  }

  function changeImporto(id: string, raw: string) {
    const v = parseFloat(raw)
    setPag((p) => ({ ...p, [id]: { ...p[id], importoRicevuto: isNaN(v) || v < 0 ? 0 : v } }))
  }

  function saveImporto(id: string, original: number) {
    const v = pag[id]?.importoRicevuto ?? 0
    if (v === original) return
    save(id, 'importoRicevuto', v, () =>
      setPag((p) => ({ ...p, [id]: { ...p[id], importoRicevuto: original } }))
    )
  }

  const filtered = ordini
    .filter((o) => filtroStato === 'tutti' || o.stato === filtroStato)
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'data') {
        return mul * ((a.dataOrdine ?? '').localeCompare(b.dataOrdine ?? ''))
      }
      return mul * ((a.prezzo ?? 0) - (b.prezzo ?? 0))
    })

  const totale = filtered.reduce((s, o) => s + (o.prezzo ?? 0), 0)

  function toggleSort(key: 'data' | 'prezzo') {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortIcon = (key: 'data' | 'prezzo') =>
    sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ' ↕'

  return (
    <div className="space-y-4">
      {/* Filtri */}
      <div className="flex flex-wrap gap-2">
        {STATI.map((s) => (
          <button
            key={s.value}
            onClick={() => setFiltroStato(s.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtroStato === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Tabella */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Miniatura</th>
              <th className="px-4 py-3 text-left">Variante</th>
              <th className="px-4 py-3 text-left">Stato</th>
              <th className="px-4 py-3 text-left">Pagamento</th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-800 select-none"
                onClick={() => toggleSort('data')}
              >
                Data{sortIcon('data')}
              </th>
              <th
                className="px-4 py-3 text-right cursor-pointer hover:text-gray-800 select-none"
                onClick={() => toggleSort('prezzo')}
              >
                Prezzo{sortIcon('prezzo')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Nessun ordine trovato.
                </td>
              </tr>
            )}
            {filtered.map((o) => (
              <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div>{o.cliente?.nome ?? '—'}</div>
                  {o.cliente?.telefono && (
                    <div className="text-xs text-gray-400">{o.cliente.telefono}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {o.miniaturaSlug ? (
                    <Link href={`/miniature/${o.miniaturaSlug}`} target="_blank"
                      className="hover:text-indigo-600 hover:underline">
                      {o.miniaturaNome ?? '—'}
                    </Link>
                  ) : (o.miniaturaNome ?? '—')}
                </td>
                <td className="px-4 py-3 text-gray-500">{o.varianteNome ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATO_STYLE[o.stato]}`}>
                    {STATO_LABEL[o.stato]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const ric = pag[o._id]?.importoRicevuto ?? 0
                    const dov = dovuto(o)
                    const residuo = Math.max(0, dov - ric)
                    const saldato = dov > 0 && residuo <= 0
                    return (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => toggleClientePagato(o._id)}
                          disabled={saving === `${o._id}:clientePagato`}
                          title="Il cliente ha pagato"
                          className={`self-start px-2 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                            pag[o._id]?.clientePagato
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {pag[o._id]?.clientePagato ? '✓ Cliente' : 'Cliente'}
                        </button>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>Ricevuto €</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={ric || ''}
                            onChange={(e) => changeImporto(o._id, e.target.value)}
                            onBlur={() => saveImporto(o._id, o.importoRicevuto ?? 0)}
                            disabled={saving === `${o._id}:importoRicevuto`}
                            placeholder="0"
                            className="w-16 px-1.5 py-0.5 rounded border border-gray-200 text-right focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
                          />
                          {dov > 0 && <span className="text-gray-400">/ {dov.toFixed(2)}</span>}
                        </div>
                        {saldato ? (
                          <span className="text-[11px] font-medium text-green-600">Saldato ✓</span>
                        ) : residuo > 0 ? (
                          <span className="text-[11px] text-red-500">Residuo €{residuo.toFixed(2)}</span>
                        ) : null}
                      </div>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{fmt(o.dataOrdine)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {o.prezzo != null ? `€${o.prezzo.toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-600">
                  Totale ({filtered.length} ordini)
                </td>
                <td className="px-4 py-3 text-right font-bold text-indigo-700 text-base">
                  €{totale.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
