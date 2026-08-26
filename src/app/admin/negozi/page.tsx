import Link from 'next/link'
import { getAllNegozi, getVenditeSegnalate, getAllOrdini, getSiteSettings } from '@/sanity/lib/queries'
import ConfermaVenditaButton from '@/components/admin/ConfermaVenditaButton'
import LogoutButton from '@/components/admin/LogoutButton'
import ProductThumb from '@/components/ProductThumb'
import EliminaButton from '@/components/admin/EliminaButton'

export const dynamic = 'force-dynamic'

export default async function AdminNegoziPage() {
  const [negozi, vendite, ordini, settings] = await Promise.all([
    getAllNegozi(),
    getVenditeSegnalate(),
    getAllOrdini(),
    getSiteSettings(),
  ])

  const globalPct = settings?.percentualeNegozio ?? 30

  const creditoPerNegozio = new Map<string, number>()
  for (const n of negozi) {
    const pct = (n.percentualeNegozio ?? globalPct) / 100
    const credito = ordini
      .filter((o) => o.negozioId === n._id && o.clientePagato)
      .reduce((s, o) => {
        const dovuto = (o.prezzo ?? 0) * (1 - pct)
        const ricevuto = o.importoRicevuto ?? 0
        return s + Math.max(0, dovuto - ricevuto)
      }, 0)
    creditoPerNegozio.set(n._id, credito)
  }

  const daRevisionare = vendite.filter((v) => v.stato === 'segnalata')
  const confermate = vendite.filter((v) => v.stato === 'confermata')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Negozi</h1>
            <p className="text-sm text-gray-400 mt-0.5">{negozi.length} negozi · {daRevisionare.length} vendite da revisionare</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
              ← Dashboard
            </Link>
            <Link href="/studio/structure/negozi;movimentoGiacenza" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
              Registra movimento →
            </Link>
            <Link href="/studio/structure/negozi;negozio" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
              Gestisci negozi in Studio →
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Negozi */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Negozi convenzionati</h2>
          {negozi.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nessun negozio ancora.{' '}
              <Link href="/studio/structure/negozi;negozio" className="text-indigo-500 hover:underline">
                Creane uno in Studio
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-2">
              {negozi.map((n) => (
                <div key={n._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-gray-800 font-medium">{n.nome}</span>
                    {n.attivo === false && <span className="ml-2 text-xs text-gray-400">🔒 disattivato</span>}
                    <Link href={`/admin/negozi/${n.slug.current}`} className="ml-3 text-xs text-indigo-500 hover:underline">
                      Gestisci giacenza →
                    </Link>
                    <a
                      href={`/negozio/${n.slug.current}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 text-xs text-indigo-500 hover:underline"
                    >
                      Portale →
                    </a>
                  </div>
                  <span className="font-semibold text-amber-600">
                    Credito: €{(creditoPerNegozio.get(n._id) ?? 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Da revisionare */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">Vendite segnalate da revisionare</h2>
          {daRevisionare.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna segnalazione in attesa.</p>
          ) : (
            <div className="space-y-3">
              {daRevisionare.map((v) => (
                <div
                  key={v._id}
                  className="flex items-center justify-between gap-4 text-sm py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-gray-800 font-medium">
                      <span className="text-gray-500">{v.negozio?.nome} — </span>
                      <ProductThumb miniatura={v.miniatura} varianteNome={v.varianteNome} />
                      <span className="text-gray-500"> ×{v.quantita}</span>
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 ml-11">
                      {v.data && new Date(v.data).toLocaleString('it-IT')}
                      {v.prezzoListino != null && ` · listino €${v.prezzoListino}`}
                      {v.prezzoStimato != null && ` · incassato €${v.prezzoStimato}`}
                      {v.offertaUsata && ' · offerta sito usata'}
                      {v.scontoExtra ? ` · sconto extra -€${v.scontoExtra}` : ''}
                      {v.note && ` · ${v.note}`}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 flex-none">
                    <ConfermaVenditaButton id={v._id} />
                    <EliminaButton id={v._id} endpoint="/api/admin/vendita-segnalata" conferma="Eliminare questa segnalazione? Non genera nessun ordine." />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storico confermate */}
        {confermate.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Storico confermate</h2>
            <div className="space-y-2">
              {confermate.map((v) => (
                <div key={v._id} className="flex items-center gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="w-20 sm:w-28 flex-none text-gray-400 truncate">{v.negozio?.nome}</span>
                  <div className="flex-1 min-w-0">
                    <ProductThumb miniatura={v.miniatura} varianteNome={v.varianteNome} />
                  </div>
                  <span className="flex-none text-gray-400 text-xs w-8 text-right">×{v.quantita}</span>
                  <span className="flex-none text-xs text-green-600 w-24 text-right">✅ Confermata</span>
                  <span className="flex-none">
                    <EliminaButton id={v._id} endpoint="/api/admin/vendita-segnalata" conferma="Eliminare questa segnalazione? L'ordine e il movimento di giacenza collegati NON vengono toccati." />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
