import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { NEGOZIO_COOKIE, verifyNegozioCookie } from '@/lib/negozioAuth'
import { computeGiacenzaCorrente, arricchisciConPrezzo } from '@/lib/giacenza'
import {
  getNegozioBySlug,
  getOrdiniPerNegozio,
  getVenditeSegnalatePerNegozio,
  getMovimentiPerNegozio,
  getAllMiniature,
  getSiteSettings,
} from '@/sanity/lib/queries'
import SegnalaVenditaForm from '@/components/negozio/SegnalaVenditaForm'
import LogoutButton from '@/components/negozio/LogoutButton'
import ProductThumb from '@/components/ProductThumb'
import RitiraSegnalazioneButton from '@/components/negozio/RitiraSegnalazioneButton'

const MOTIVO_LABEL: Record<string, string> = {
  consegna: '📦 Consegna',
  ritiro: '↩️ Ritiro',
  vendita_confermata: '✅ Vendita confermata',
  rettifica: '🔧 Rettifica',
}

export const dynamic = 'force-dynamic'

const STATO_LABEL: Record<string, string> = {
  segnalata: '🆕 Da revisionare',
  confermata: '✅ Confermata',
}

export default async function NegozioPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Il proxy ha già verificato il cookie a livello di rotta; qui lo riverifichiamo
  // per sicurezza (difesa in profondità) e per essere certi di limitare i dati al negozio giusto.
  const cookieStore = await cookies()
  const verifiedSlug = await verifyNegozioCookie(cookieStore.get(NEGOZIO_COOKIE)?.value)
  if (verifiedSlug !== slug) {
    redirect(`/negozio/${slug}/login`)
  }

  const negozio = await getNegozioBySlug(slug)
  if (!negozio || negozio.attivo === false) {
    notFound()
  }

  const [ordini, venditeSegnalate, movimenti, miniature, settings] = await Promise.all([
    getOrdiniPerNegozio(negozio._id),
    getVenditeSegnalatePerNegozio(negozio._id),
    getMovimentiPerNegozio(negozio._id),
    getAllMiniature(),
    getSiteSettings(),
  ])

  const pct = (negozio.percentualeNegozio ?? settings?.percentualeNegozio ?? 30) / 100
  const credito = ordini
    .filter((o) => o.clientePagato)
    .reduce((s, o) => {
      const dovuto = (o.prezzo ?? 0) * (1 - pct)
      const ricevuto = o.importoRicevuto ?? 0
      return s + Math.max(0, dovuto - ricevuto)
    }, 0)

  const giacenze = arricchisciConPrezzo(computeGiacenzaCorrente(movimenti), miniature)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{negozio.nome}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Portale negozio · Quoll</p>
          </div>
          <div className="flex-none">
            <LogoutButton slug={slug} />
          </div>
        </div>

        {/* Credito */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Credito attuale verso Quoll
          </p>
          <p className="text-3xl font-bold text-amber-600">€{credito.toFixed(2)}</p>
          <p className="text-sm text-gray-400 mt-1">
            Quota che devi ancora versare a Quoll sulle vendite già incassate ({Math.round(pct * 100)}% resta a te).
          </p>
        </div>

        {/* Giacenze */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Giacenze in negozio</h2>
          {giacenze.length === 0 ? (
            <p className="text-sm text-gray-400">Nessuna giacenza registrata al momento.</p>
          ) : (
            <div className="space-y-2">
              {giacenze.map((g) => (
                <div
                  key={g._key}
                  className="flex items-center justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <ProductThumb miniatura={g.miniatura} varianteNome={g.varianteNome} />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-none">
                    {g.prezzoScontato != null ? (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        <span className="line-through">€{g.prezzo}</span> €{g.prezzoScontato}
                      </span>
                    ) : g.prezzo != null ? (
                      <span className="text-xs text-gray-400 whitespace-nowrap">€{g.prezzo}</span>
                    ) : null}
                    <span className="font-medium text-gray-900">{g.quantita}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storico movimenti giacenza */}
        {movimenti.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">Storico movimenti</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {movimenti.map((m) => (
                <div key={m._id} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <ProductThumb miniatura={m.miniatura} varianteNome={m.varianteNome} />
                    {m.data && (
                      <span className="text-gray-400 block text-xs mt-0.5">
                        {new Date(m.data).toLocaleDateString('it-IT')} · {MOTIVO_LABEL[m.motivo] ?? m.motivo}
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold flex-none ${m.quantita > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {m.quantita > 0 ? '+' : ''}{m.quantita}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Segnala vendita */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Segnala una vendita</h2>
          <SegnalaVenditaForm giacenze={giacenze} />
        </div>

        {/* Storico segnalazioni */}
        {venditeSegnalate.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Vendite segnalate</h2>
            <div className="space-y-2">
              {venditeSegnalate.map((v) => (
                <div key={v._id} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ProductThumb miniatura={v.miniatura} varianteNome={v.varianteNome} />
                      <span className="text-gray-400">×{v.quantita}</span>
                    </div>
                    <span className="text-gray-400 block text-xs mt-0.5">
                      {v.data && new Date(v.data).toLocaleDateString('it-IT')}
                      {v.prezzoStimato != null && ` · €${v.prezzoStimato}`}
                      {v.offertaUsata && ' · offerta sito'}
                      {v.scontoExtra ? ` · sconto extra -€${v.scontoExtra}` : ''}
                    </span>
                  </div>
                  <span className="flex items-center gap-2 flex-none">
                    <span className="text-xs font-medium text-gray-500">{STATO_LABEL[v.stato] ?? v.stato}</span>
                    {v.stato === 'segnalata' && <RitiraSegnalazioneButton id={v._id} />}
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
