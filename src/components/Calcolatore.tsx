'use client'

import { useState } from 'react'
import { parseSTL } from '@/utils/stlParser'
import {
  calcolaPrezzo, categoriaSupporti, tecnologiaProfilo, SUPPORTI,
  type Geometria, type SupportiId,
} from '@/utils/calcoloPrezzo'
import type { ProfiloPrezzo, Tecnologia } from '@/types/miniatura'

const SCALE = [50, 75, 100, 125, 150, 200]
const MAX_SIZE_MB = 500

const TECNOLOGIE: { id: Tecnologia; label: string; desc: string }[] = [
  { id: 'fff',    label: 'FFF / Filamento', desc: 'PLA, PETG… più economica' },
  { id: 'resina', label: 'Resina (MSLA)',   desc: 'Massimo dettaglio' },
]

interface FileInfo {
  name: string
  geometria: Geometria
  overhangRatio: number
}

interface Props {
  profili: ProfiloPrezzo[]
  percentualeNegozio?: number
  /** Mostra supporti modificabili, dettaglio costi e netto */
  admin?: boolean
}

const eur = (n: number) => `€${n.toFixed(2)}`

function Scelta({ attivo, onClick, children, className = '' }: {
  attivo: boolean; onClick: () => void; children: React.ReactNode; className?: string
}) {
  return (
    <button onClick={onClick}
      className={`rounded-xl border text-left transition-all ${className} ${
        attivo ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
      }`}>
      {children}
    </button>
  )
}

function Riga({ label, value, sub, forte }: { label: string; value: string; sub?: string; forte?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${forte ? 'border-t border-gray-200 mt-1 pt-2.5' : ''}`}>
      <span className={`text-sm ${forte ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
        {label}
        {sub && <span className="block text-xs text-gray-400">{sub}</span>}
      </span>
      <span className={`font-semibold whitespace-nowrap ${forte ? 'text-gray-900' : 'text-gray-700 text-sm'}`}>{value}</span>
    </div>
  )
}

export default function Calcolatore({ profili, percentualeNegozio = 0, admin = false }: Props) {
  const tecnologieDisponibili = TECNOLOGIE.filter((t) => profili.some((p) => tecnologiaProfilo(p) === t.id))

  const [file, setFile]         = useState<FileInfo | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const [supportiOverride, setSupportiOverride] = useState<SupportiId | null>(null)
  const [tecnologia, setTecnologia] = useState<Tecnologia>(tecnologieDisponibili[0]?.id ?? 'fff')
  const [profiloId, setProfiloId]   = useState<string>('')
  const [finituraId, setFinituraId] = useState<string>('')
  const [scala, setScala]           = useState(100)

  const processFile = async (f: File) => {
    setError(null)
    setSupportiOverride(null)
    if (!f.name.toLowerCase().endsWith('.stl')) { setError('Formato non supportato. Carica un file .stl'); return }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) { setError(`File troppo grande. Massimo ${MAX_SIZE_MB} MB.`); return }
    setLoading(true)
    try {
      const { volumeMm3, superficieMm2, overhangRatio, boundingBox } = parseSTL(await f.arrayBuffer())
      if (volumeMm3 === 0) throw new Error('Volume zero — verifica che il file STL sia valido.')
      setFile({ name: f.name, geometria: { volumeMm3, superficieMm2, boundingBox }, overhangRatio })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nel parsing del file STL.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  // Se la selezione precedente non è valida per la tecnologia/profilo attuale si ripiega sul primo disponibile
  const profiliTecnologia = profili.filter((p) => tecnologiaProfilo(p) === tecnologia)
  const profilo = profiliTecnologia.find((p) => p._id === profiloId) ?? profiliTecnologia[0]
  const finiture = profilo?.finiture ?? []
  const finitura = finiture.find((f) => f._id === finituraId) ?? finiture[0]

  const autoSupporti = file ? categoriaSupporti(file.overhangRatio) : null
  const supporti: SupportiId = (admin ? supportiOverride : null) ?? autoSupporti ?? 'nessuno'

  const r = file && profilo
    ? calcolaPrezzo({ geometria: file.geometria, profilo, finitura, scalaPct: scala, supporti, percentualeNegozio })
    : null

  const bb = file?.geometria.boundingBox
  const dimMaxOriginale = bb ? Math.max(bb.x, bb.y, bb.z) : 0
  const unitaSospetta = file && (dimMaxOriginale < 8 || dimMaxOriginale > 500)

  const prezzoStr = r ? (r.prezzoMin === r.prezzoMax ? `€${r.prezzoMin}` : `€${r.prezzoMin} – €${r.prezzoMax}`) : ''

  const whatsappMsg = encodeURIComponent(
    file && r && profilo
      ? `Ciao! Ho usato il calcolatore sul sito.\n\nFile: ${file.name}\nTecnologia: ${tecnologia === 'fff' ? 'FFF/Filamento' : 'Resina'}\nMateriale: ${profilo.nome}${finitura ? ` — ${finitura.nome}` : ''}\nScala: ${scala}% (circa ${Math.round(r.dimMaxMm)} mm)\nStima prezzo: ${prezzoStr}\n\nPotete darmi un preventivo reale?`
      : 'Ciao! Vorrei un preventivo per una miniatura stampata in 3D.',
  )

  if (profili.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-amber-800 text-sm">
        Nessun profilo di prezzo configurato. Vai in Studio → Profili di prezzo per crearne uno.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {!admin && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
          <svg className="w-5 h-5 text-green-500 flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span><strong>Privacy garantita:</strong> il file viene elaborato nel browser e non viene mai caricato su alcun server.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sinistra — scelte */}
        <div className="space-y-6">

          {/* Upload */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">File STL del modello</p>
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-3 w-full h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                dragging ? 'border-indigo-400 bg-indigo-50'
                : file ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <input type="file" accept=".stl" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
              {loading ? (
                <div className="flex items-center gap-2 text-indigo-600">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-sm font-medium">Analisi in corso…</span>
                </div>
              ) : file && bb ? (
                <>
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-center px-4">
                    <p className="text-sm font-semibold text-green-700 break-all">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {bb.x.toFixed(1)} × {bb.y.toFixed(1)} × {bb.z.toFixed(1)} mm
                    </p>
                    <p className="text-xs text-indigo-500 mt-1">Clicca per cambiare file</p>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Trascina qui il file STL</p>
                    <p className="text-xs text-gray-400 mt-0.5">o clicca per sfogliare · max {MAX_SIZE_MB} MB</p>
                  </div>
                </>
              )}
            </label>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {unitaSospetta && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Il modello risulta di {dimMaxOriginale.toFixed(1)} mm: forse il file è esportato in un&apos;altra unità di misura
                (cm, pollici, metri). In quel caso la stima non è affidabile, scrivici su WhatsApp.
              </p>
            )}
          </div>

          {/* Tecnologia */}
          {tecnologieDisponibili.length > 1 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Tecnologia di stampa</p>
              <div className="flex gap-2">
                {tecnologieDisponibili.map((t) => (
                  <Scelta key={t.id} attivo={tecnologia === t.id} onClick={() => setTecnologia(t.id)} className="flex-1 px-3 py-2.5">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </Scelta>
                ))}
              </div>
            </div>
          )}

          {/* Materiale — solo quelli della tecnologia scelta */}
          {profiliTecnologia.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Materiale</p>
              <div className="flex flex-wrap gap-2">
                {profiliTecnologia.map((p) => (
                  <Scelta key={p._id} attivo={profilo?._id === p._id} onClick={() => setProfiloId(p._id)} className="px-4 py-2 text-sm font-medium">
                    {p.nome}{admin && p.visibileAlPubblico === false ? ' (solo admin)' : ''}
                  </Scelta>
                ))}
              </div>
            </div>
          )}

          {/* Finitura */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Finitura</p>
            {finiture.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {finiture.map((f) => (
                  <Scelta key={f._id} attivo={finitura?._id === f._id} onClick={() => setFinituraId(f._id)} className="px-4 py-2 text-sm font-medium">
                    {f.nome}
                    {admin && <span className="ml-1.5 text-xs text-gray-400">{f.oreLavoro}h</span>}
                  </Scelta>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Nessuna finitura associata a questo profilo. Aggiungila in Studio → Profili di prezzo.
              </p>
            )}
          </div>

          {/* Scala */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Scala di stampa</p>
            <div className="flex flex-wrap gap-2">
              {SCALE.map((s) => (
                <Scelta key={s} attivo={scala === s} onClick={() => setScala(s)} className="px-3 py-1.5 text-sm font-medium">
                  {s}%
                </Scelta>
              ))}
            </div>
          </div>

          {/* Supporti — solo admin, il pubblico usa il rilevamento automatico */}
          {admin && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Supporti</p>
                {file && autoSupporti && !supportiOverride && (
                  <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    automatico · {Math.round(file.overhangRatio * 100)}% sbalzo
                  </span>
                )}
                {supportiOverride && (
                  <button onClick={() => setSupportiOverride(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ripristina auto
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTI.map((s) => (
                  <Scelta key={s.id} attivo={supporti === s.id} onClick={() => setSupportiOverride(s.id === autoSupporti ? null : s.id)} className="px-3 py-2">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.desc}</p>
                  </Scelta>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Destra — risultati */}
        <div className="space-y-4">
          {r && profilo ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-bold text-gray-900">Stima</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Dimensione</p>
                    <p className="text-base font-bold text-gray-800">{Math.round(r.dimMaxMm)} mm</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Materiale</p>
                    <p className="text-base font-bold text-gray-800">{r.pesoG.toFixed(1)} g</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Stampa</p>
                    <p className="text-base font-bold text-gray-800">~{r.oreStampa.toFixed(1)} h</p>
                  </div>
                </div>
                <div className="bg-indigo-600 rounded-xl p-5 text-white">
                  <p className="text-indigo-200 text-sm mb-1">Prezzo indicativo</p>
                  <p className="text-3xl font-bold">{prezzoStr}</p>
                  <p className="text-indigo-200 text-xs mt-2">
                    {profilo.nome}{finitura ? ` · ${finitura.nome}` : ''} · scala {scala}%
                  </p>
                </div>
              </div>

              {admin ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="font-bold text-gray-900 mb-3">Dettaglio costi</h2>

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">Stampa</p>
                  <Riga label="Materiale" sub={`${r.pesoG.toFixed(1)} g · supporti ${SUPPORTI.find((s) => s.id === supporti)!.label.toLowerCase()}`} value={eur(r.costoMateriale)} />
                  <Riga label="Elettricità" sub={`${r.oreStampa.toFixed(2)} h · ${r.layer.toLocaleString('it')} layer`} value={eur(r.costoElettricita)} />
                  <Riga label="Usura macchina" value={eur(r.costoMacchina)} />
                  <Riga label="Costi vivi" value={eur(r.costiVivi)} forte />
                  <Riga
                    label={r.minimoApplicato ? 'Prezzo stampa (minimo applicato)' : `Prezzo stampa (+${profilo.markupPct}% markup)`}
                    value={eur(r.prezzoStampa)}
                  />
                  {r.quotaCommissione > 0 && (
                    <Riga label={`Ricarico commissione negozio (${percentualeNegozio}%)`} sub="solo sulla parte stampa" value={`+${eur(r.quotaCommissione)}`} />
                  )}

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-4">Lavoro manuale</p>
                  <Riga
                    label="Ore reali"
                    sub={`${finitura?.oreLavoro ?? 0} h base × ${r.fattoreDimensione.toFixed(2)} dimensione (${r.superficieCm2.toFixed(0)} cm²)`}
                    value={`${r.oreLavoroReali.toFixed(2)} h`}
                  />
                  <Riga label="Ore fatturate (curva)" value={`${r.oreLavoroFatturate.toFixed(2)} h`} />
                  <Riga
                    label="Lavoro"
                    sub={r.oreLavoroReali > 0 ? `tariffa effettiva ${eur(r.prezzoLavoro / r.oreLavoroReali)}/h` : undefined}
                    value={eur(r.prezzoLavoro)}
                  />

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-4">Totale</p>
                  <Riga label="Prezzo centrale" sub={`range mostrato al pubblico: ${prezzoStr}`} value={eur(r.prezzo)} forte />
                  <Riga label="Netto vendita diretta" sub={`guadagno sui costi vivi: ${eur(r.prezzo - r.costiVivi)}`} value={eur(r.prezzo)} />
                  {percentualeNegozio > 0 && (
                    <Riga
                      label={`Netto vendita in negozio (−${percentualeNegozio}%)`}
                      sub={`guadagno sui costi vivi: ${eur(r.prezzo * (1 - percentualeNegozio / 100) - r.costiVivi)}`}
                      value={eur(r.prezzo * (1 - percentualeNegozio / 100))}
                    />
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                    <p className="font-semibold mb-1">Solo una stima indicativa</p>
                    <p className="leading-relaxed">
                      Tempi e supporti dipendono dall&apos;orientamento reale del pezzo e dalle impostazioni di stampa.
                      Il prezzo finale viene concordato dopo il preventivo.
                    </p>
                  </div>
                  <a href={`/vai/whatsapp?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Richiedi preventivo reale
                  </a>
                </>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Carica un file STL per vedere la stima</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
