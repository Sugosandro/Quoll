import Link from 'next/link'
import { notFound } from 'next/navigation'
import { computeGiacenzaCorrente, arricchisciConPrezzo } from '@/lib/giacenza'
import { getNegozioBySlug, getAllNegozi, getMovimentiPerNegozio, getAllMiniature } from '@/sanity/lib/queries'
import GiacenzaTable from '@/components/admin/GiacenzaTable'
import GiacenzaCatalogo from '@/components/admin/GiacenzaCatalogo'
import LogoutButton from '@/components/admin/LogoutButton'
import ProductThumb from '@/components/ProductThumb'
import EliminaButton from '@/components/admin/EliminaButton'

export const dynamic = 'force-dynamic'

const MOTIVO_LABEL: Record<string, string> = {
  consegna: '📦 Consegna',
  ritiro: '↩️ Ritiro',
  vendita_confermata: '✅ Vendita confermata',
  rettifica: '🔧 Rettifica',
}

export default async function AdminNegozioDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [negozio, tuttiNegozi, miniature] = await Promise.all([
    getNegozioBySlug(slug),
    getAllNegozi(),
    getAllMiniature(),
  ])

  if (!negozio) notFound()

  const movimenti = await getMovimentiPerNegozio(negozio._id)

  const giacenze = arricchisciConPrezzo(computeGiacenzaCorrente(movimenti), miniature)
  const altriNegozi = tuttiNegozi.filter((n) => n._id !== negozio._id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{negozio.nome}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestione giacenza</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/negozi" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
              ← Negozi
            </Link>
            <a
              href={`/negozio/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Portale negozio →
            </a>
            <LogoutButton />
          </div>
        </div>

        {/* Giacenza attuale */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Giacenza attuale</h2>
          <GiacenzaTable negozioId={negozio._id} negozioSlug={slug} giacenze={giacenze} altriNegozi={altriNegozi} />
        </div>

        {/* Assegna dal catalogo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Assegna prodotti dal catalogo</h2>
          <GiacenzaCatalogo negozioId={negozio._id} negozioSlug={slug} miniature={miniature} giacenzeAttuali={giacenze} />
        </div>

        {/* Storico */}
        {movimenti.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Storico movimenti</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {movimenti.map((m) => (
                <div key={m._id} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <ProductThumb miniatura={m.miniatura} varianteNome={m.varianteNome} />
                    {m.data && (
                      <span className="text-gray-400 block text-xs mt-0.5 ml-11">
                        {new Date(m.data).toLocaleString('it-IT')} · {MOTIVO_LABEL[m.motivo] ?? m.motivo}
                        {m.note && ` · ${m.note}`}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-2 flex-none">
                    <span className={`font-semibold ${m.quantita > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {m.quantita > 0 ? '+' : ''}
                      {m.quantita}
                    </span>
                    <EliminaButton id={m._id} endpoint="/api/admin/movimento-giacenza" conferma="Eliminare questo movimento? La giacenza si ricalcola di conseguenza." />
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
