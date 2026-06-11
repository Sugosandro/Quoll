import { getAllOrdini, getAllCosti, getSiteSettings } from '@/sanity/lib/queries'
import StatsCard from '@/components/admin/StatsCard'
import OrdersTable from '@/components/admin/OrdersTable'
import Link from 'next/link'

export const revalidate = 30

const CATEGORIA_LABEL: Record<string, string> = {
  materiale: 'Materiale', attrezzatura: 'Attrezzatura', negozio: 'Negozio', altro: 'Altro',
}

function inizioMese() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

export default async function AdminPage() {
  const [ordini, costi, settings] = await Promise.all([
    getAllOrdini(),
    getAllCosti(),
    getSiteSettings(),
  ])

  const percentualeNegozio = settings?.percentualeNegozio ?? 30

  const consegnati = ordini.filter((o) => o.stato === 'consegnato' && o.prezzo != null)
  const incassato = consegnati.reduce((s, o) => s + (o.prezzo ?? 0), 0)

  const quotaNegozio = consegnati
    .filter((o) => o.venditaTramiteNegozio)
    .reduce((s, o) => s + (o.prezzo ?? 0) * (percentualeNegozio / 100), 0)

  const guadagnoNetto = incassato - quotaNegozio

  const attivi = ordini.filter((o) => o.stato !== 'consegnato').length

  const conPrezzo = ordini.filter((o) => o.prezzo != null)
  const mediaOrdine = conPrezzo.length
    ? conPrezzo.reduce((s, o) => s + (o.prezzo ?? 0), 0) / conPrezzo.length
    : 0

  const questoMese = ordini
    .filter((o) => o.stato === 'consegnato' && (o.dataOrdine ?? '') >= inizioMese())
    .reduce((s, o) => s + (o.prezzo ?? 0), 0)

  const totaleCosti = costi.reduce((s, c) => s + c.importo, 0)
  const margineNetto = guadagnoNetto - totaleCosti

  // Breakdown per miniatura
  const byMiniatura = Object.values(
    ordini.reduce<Record<string, { nome: string; totale: number; count: number }>>((acc, o) => {
      const key = o.miniaturaNome ?? 'Sconosciuta'
      if (!acc[key]) acc[key] = { nome: key, totale: 0, count: 0 }
      acc[key].totale += o.prezzo ?? 0
      acc[key].count += 1
      return acc
    }, {})
  ).sort((a, b) => b.totale - a.totale)

  // Breakdown costi per categoria
  const byCat = Object.entries(
    costi.reduce<Record<string, number>>((acc, c) => {
      acc[c.categoria] = (acc[c.categoria] ?? 0) + c.importo
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{ordini.length} ordini totali</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/calcolatore" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
              Calcolatore costi →
            </Link>
            <Link href="/studio" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
              Studio →
            </Link>
          </div>
        </div>

        {/* KPI — ricavi */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Ricavi</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard label="Totale incassato" value={`€${incassato.toFixed(2)}`} sub="ordini consegnati" color="green" />
          <StatsCard label={`Quota negozio (${percentualeNegozio}%)`} value={`€${quotaNegozio.toFixed(2)}`} sub="vendite tramite negozio" color="amber" />
          <StatsCard label="Guadagno netto" value={`€${guadagnoNetto.toFixed(2)}`} sub="incassato − quota negozio" color="indigo" />
          <StatsCard label="Questo mese" value={`€${questoMese.toFixed(2)}`} sub="consegnati nel mese corrente" color="gray" />
        </div>

        {/* KPI — costi & performance */}
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Costi & performance</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatsCard label="Totale costi" value={`€${totaleCosti.toFixed(2)}`} sub="somma spese registrate" color="red" />
          <StatsCard label="Margine netto" value={margineNetto >= 0 ? `€${margineNetto.toFixed(2)}` : `-€${Math.abs(margineNetto).toFixed(2)}`} sub="guadagno − costi" color={margineNetto >= 0 ? 'green' : 'red'} />
          <StatsCard label="Ordini attivi" value={String(attivi)} sub="ricevuti + in lav. + pronti" color="amber" />
          <StatsCard label="Valore medio" value={mediaOrdine > 0 ? `€${mediaOrdine.toFixed(2)}` : '—'} sub="per ordine" color="gray" />
        </div>

        {/* Tabella ordini */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Ordini</h2>
          <OrdersTable ordini={ordini} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Breakdown miniature */}
          {byMiniatura.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Ricavi per miniatura</h2>
              <div className="space-y-2">
                {byMiniatura.map((m) => {
                  const max = byMiniatura[0].totale
                  const pct = max > 0 ? (m.totale / max) * 100 : 0
                  return (
                    <div key={m.nome}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{m.nome}</span>
                        <span className="text-gray-500">€{m.totale.toFixed(2)} · {m.count} ordini</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Breakdown costi */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Costi per categoria</h2>
              <Link href="/studio/structure/costo" className="text-xs text-indigo-600 hover:text-indigo-800">
                Aggiungi →
              </Link>
            </div>
            {byCat.length > 0 ? (
              <div className="space-y-2">
                {byCat.map(([cat, totale]) => {
                  const max = byCat[0][1]
                  const pct = max > 0 ? (totale / max) * 100 : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{CATEGORIA_LABEL[cat] ?? cat}</span>
                        <span className="text-gray-500">€{totale.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-800">Totale</span>
                  <span className="font-semibold text-gray-800">€{totaleCosti.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">
                Nessun costo registrato.{' '}
                <Link href="/studio" className="text-indigo-500 hover:underline">Vai allo Studio</Link> per aggiungerne.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
