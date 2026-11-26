'use client'

import { useState } from 'react'
import { parseSTL } from '@/utils/stlParser'
import {
  calcolaOrdine, categoriaSupporti, tecnologiaProfilo, SUPPORTI,
  type Geometria, type SupportiId,
} from '@/utils/calcoloPrezzo'
import type { ProfiloPrezzo, Tecnologia, ScontoQuantita } from '@/types/miniatura'

const SCALE = [50, 75, 100, 125, 150, 200]
const MAX_SIZE_MB = 500
const MAX_FILE = 20
const MAX_QUANTITA = 99

const TECNOLOGIE: { id: Tecnologia; label: string; desc: string }[] = [
  { id: 'fff',    label: 'FFF / Filamento', desc: 'PLA, PETG… più economica' },
  { id: 'resina', label: 'Resina (MSLA)',   desc: 'Massimo dettaglio' },
]

interface Riga {
  id: string
  nome: string
  geometria: Geometria
  overhangRatio: number
  quantita: number
  scala: number
  finituraId: string
  supportiOverride: SupportiId | null
}

interface Props {
  profili: ProfiloPrezzo[]
  percentualeNegozio?: number
  scontiQuantita?: ScontoQuantita[] | null
  /** Mostra supporti modificabili, dettaglio costi e netto */
  admin?: boolean
}

let contatoreRighe = 0
const nuovoIdRiga = () => `riga-${++contatoreRighe}`

const eur = (n: number) => `€${n.toFixed(2)}`
const selectCls = 'w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300'

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

function Voce({ label, value, sub, forte }: { label: string; value: string; sub?: string; forte?: boolean }) {
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

export default function Calcolatore({ profili, percentualeNegozio = 0, scontiQuantita, admin = false }: Props) {
  const tecnologieDisponibili = TECNOLOGIE.filter((t) => profili.some((p) => tecnologiaProfilo(p) === t.id))

  const [righe, setRighe]       = useState<Riga[]>([])
  const [errori, setErrori]     = useState<string[]>([])
  const [loading, setLoading]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const [tecnologia, setTecnologia] = useState<Tecnologia>(tecnologieDisponibili[0]?.id ?? 'fff')
  const [profiloId, setProfiloId]   = useState<string>('')

  // Se la selezione precedente non è valida per la tecnologia attuale si ripiega sul primo materiale disponibile
  const profiliTecnologia = profili.filter((p) => tecnologiaProfilo(p) === tecnologia)
  const profilo = profiliTecnologia.find((p) => p._id === profiloId) ?? profiliTecnologia[0]
  const finiture = profilo?.finiture ?? []
  const finituraDi = (r: Riga) => finiture.find((f) => f._id === r.finituraId) ?? finiture[0]
  const supportiDi = (r: Riga): SupportiId => (admin ? r.supportiOverride : null) ?? categoriaSupporti(r.overhangRatio)

  const aggiornaRiga = (id: string, patch: Partial<Riga>) =>
    setRighe((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const processFiles = async (lista: File[]) => {
    const nuoviErrori: string[] = []
    const posti = MAX_FILE - righe.length
    if (lista.length > posti) nuoviErrori.push(`Puoi caricare al massimo ${MAX_FILE} file per stima.`)
    // I nuovi file ereditano la finitura dell'ultimo aggiunto: di solito un ordine è omogeneo
    const finituraIniziale = righe.at(-1)?.finituraId ?? finiture[0]?._id ?? ''
    setLoading(true)
    const nuove: Riga[] = []
    for (const f of lista.slice(0, Math.max(0, posti))) {
      if (!f.name.toLowerCase().endsWith('.stl')) { nuoviErrori.push(`${f.name}: formato non supportato, serve un .stl`); continue }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { nuoviErrori.push(`${f.name}: troppo grande (max ${MAX_SIZE_MB} MB)`); continue }
      try {
        const { volumeMm3, superficieMm2, overhangRatio, boundingBox } = parseSTL(await f.arrayBuffer())
        if (volumeMm3 === 0) throw new Error('volume zero, verifica che il file sia valido')
        nuove.push({
          id: nuovoIdRiga(),
          nome: f.name.replace(/\.stl$/i, ''),
          geometria: { volumeMm3, superficieMm2, boundingBox },
          overhangRatio, quantita: 1, scala: 100, finituraId: finituraIniziale, supportiOverride: null,
        })
      } catch (e) {
        nuoviErrori.push(`${f.name}: ${e instanceof Error ? e.message : 'errore nella lettura del file'}`)
      }
    }
    setRighe((rs) => [...rs, ...nuove])
    setErrori(nuoviErrori)
    setLoading(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    processFiles(Array.from(e.dataTransfer.files))
  }

  const r = righe.length > 0 && profilo
    ? calcolaOrdine({
        righe: righe.map((rg) => ({ geometria: rg.geometria, finitura: finituraDi(rg), scalaPct: rg.scala, quantita: rg.quantita, supporti: supportiDi(rg) })),
        profilo, percentualeNegozio, scontiQuantita: scontiQuantita ?? [],
      })
    : null

  const prezzoStr = r ? (r.prezzoMin === r.prezzoMax ? `€${r.prezzoMin}` : `€${r.prezzoMin} – €${r.prezzoMax}`) : ''
  const risparmio = r?.prezzoPezziSingoli != null ? r.prezzoPezziSingoli - r.prezzo : 0
  const tiers = (scontiQuantita ?? []).filter((s) => s.minPezzi > 1 && s.scontoPct > 0).sort((a, b) => a.minPezzi - b.minPezzi)

  const whatsappMsg = encodeURIComponent(
    r && profilo
      ? [
          'Ciao! Ho usato il calcolatore sul sito.',
          '',
          `Tecnologia: ${tecnologia === 'fff' ? 'FFF/Filamento' : 'Resina'} · Materiale: ${profilo.nome}`,
          ...righe.map((rg, i) =>
            `• ${rg.quantita}× ${rg.nome} — ${finituraDi(rg)?.nome ?? ''} · scala ${rg.scala}% (circa ${Math.round(r.righe[i].dimMaxMm)} mm)`),
          `Totale pezzi: ${r.nPezzi}`,
          `Stima prezzo: ${prezzoStr}`,
          '',
          'Potete darmi un preventivo reale?',
        ].join('\n')
      : 'Ciao! Vorrei un preventivo per una stampa 3D.',
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
          <span><strong>Privacy garantita:</strong> i file vengono elaborati nel browser e non vengono mai caricati su alcun server.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sinistra — scelte */}
        <div className="space-y-6">

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

          {/* File */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Modelli STL
              {righe.length > 0 && <span className="ml-1.5 text-xs font-normal text-gray-400">{righe.length}/{MAX_FILE}</span>}
            </p>

            {righe.length > 0 && (
              <div className="space-y-3 mb-3">
                {righe.map((rg, i) => {
                  const bb = rg.geometria.boundingBox
                  const dimMax = Math.max(bb.x, bb.y, bb.z)
                  const autoSup = categoriaSupporti(rg.overhangRatio)
                  return (
                    <div key={rg.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 break-all">{rg.nome}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {bb.x.toFixed(1)} × {bb.y.toFixed(1)} × {bb.z.toFixed(1)} mm
                            {r && rg.scala !== 100 && ` → circa ${Math.round(r.righe[i].dimMaxMm)} mm`}
                          </p>
                        </div>
                        <button onClick={() => setRighe((rs) => rs.filter((x) => x.id !== rg.id))}
                          className="flex-none p-1 -m-1 text-gray-300 hover:text-red-500 transition-colors" aria-label={`Rimuovi ${rg.nome}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {(dimMax < 8 || dimMax > 500) && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                          Il modello risulta di {dimMax.toFixed(1)} mm: forse il file è esportato in un&apos;altra unità di misura
                          (cm, pollici, metri). In quel caso la stima non è affidabile, scrivici su WhatsApp.
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-[auto_1fr_1.6fr] gap-3 mt-3 items-end">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Quantità</p>
                          <div className="flex items-center rounded-lg border border-gray-200 bg-white w-fit">
                            <button onClick={() => aggiornaRiga(rg.id, { quantita: Math.max(1, rg.quantita - 1) })}
                              className="px-2.5 py-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30" disabled={rg.quantita <= 1} aria-label="Diminuisci">−</button>
                            <input type="number" min={1} max={MAX_QUANTITA} value={rg.quantita}
                              onChange={(e) => aggiornaRiga(rg.id, { quantita: Math.min(MAX_QUANTITA, Math.max(1, parseInt(e.target.value) || 1)) })}
                              className="w-10 text-center text-sm font-semibold text-gray-800 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                            <button onClick={() => aggiornaRiga(rg.id, { quantita: Math.min(MAX_QUANTITA, rg.quantita + 1) })}
                              className="px-2.5 py-1 text-gray-500 hover:text-indigo-600" aria-label="Aumenta">+</button>
                          </div>
                        </div>
                        <label className="block">
                          <span className="block text-xs text-gray-500 mb-1">Scala</span>
                          <select value={rg.scala} onChange={(e) => aggiornaRiga(rg.id, { scala: Number(e.target.value) })} className={selectCls}>
                            {SCALE.map((s) => <option key={s} value={s}>{s}%</option>)}
                          </select>
                        </label>
                        <label className="block col-span-2 sm:col-span-1">
                          <span className="block text-xs text-gray-500 mb-1">Finitura</span>
                          <select value={finituraDi(rg)?._id ?? ''} onChange={(e) => aggiornaRiga(rg.id, { finituraId: e.target.value })} className={selectCls}
                            disabled={finiture.length === 0}>
                            {finiture.map((f) => <option key={f._id} value={f._id}>{f.nome}{admin ? ` (${f.oreLavoro}h)` : ''}</option>)}
                          </select>
                        </label>
                        {admin && (
                          <label className="block col-span-2 sm:col-span-3">
                            <span className="block text-xs text-gray-500 mb-1">
                              Supporti <span className="text-gray-400">· automatico: {SUPPORTI.find((s) => s.id === autoSup)!.label.toLowerCase()} ({Math.round(rg.overhangRatio * 100)}% sbalzo)</span>
                            </span>
                            <select value={supportiDi(rg)} className={selectCls}
                              onChange={(e) => aggiornaRiga(rg.id, { supportiOverride: e.target.value === autoSup ? null : e.target.value as SupportiId })}>
                              {SUPPORTI.map((s) => <option key={s.id} value={s.id}>{s.label} (+{s.overhead}% materiale)</option>)}
                            </select>
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {finiture.length === 0 && righe.length > 0 && (
              <p className="mb-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Nessuna finitura associata a questo materiale. Aggiungila in Studio → Profili di prezzo.
              </p>
            )}

            {righe.length < MAX_FILE && (
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                  righe.length > 0 ? 'h-24' : 'h-40'
                } ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
              >
                <input type="file" accept=".stl" multiple className="sr-only"
                  onChange={(e) => { processFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />
                {loading ? (
                  <div className="flex items-center gap-2 text-indigo-600">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-sm font-medium">Analisi in corso…</span>
                  </div>
                ) : righe.length > 0 ? (
                  <p className="text-sm font-medium text-gray-500">+ Aggiungi altri modelli</p>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Trascina qui uno o più file STL</p>
                      <p className="text-xs text-gray-400 mt-0.5">o clicca per sfogliare · max {MAX_SIZE_MB} MB a file</p>
                    </div>
                  </>
                )}
              </label>
            )}
            {errori.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-sm text-red-600">
                {errori.map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}
            {tiers.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                <span className="font-semibold text-indigo-600">Più pezzi, più risparmi:</span>{' '}
                {tiers.map((t) => `da ${t.minPezzi} −${t.scontoPct}%`).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Destra — risultati */}
        <div className="space-y-4">
          {r && profilo ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-bold text-gray-900">Stima</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Pezzi</p>
                    <p className="text-base font-bold text-gray-800">{r.nPezzi}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Materiale</p>
                    <p className="text-base font-bold text-gray-800">{r.pesoG.toFixed(r.pesoG < 100 ? 1 : 0)} g</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Stampa</p>
                    <p className="text-base font-bold text-gray-800">~{r.oreStampa.toFixed(1)} h</p>
                    {r.piatti.length > 1 && <p className="text-xs text-gray-400">{r.piatti.length} stampe</p>}
                  </div>
                </div>
                <div className="bg-indigo-600 rounded-xl p-5 text-white">
                  <p className="text-indigo-200 text-sm mb-1">{r.nPezzi > 1 ? 'Prezzo indicativo dell\'ordine' : 'Prezzo indicativo'}</p>
                  <p className="text-3xl font-bold">{prezzoStr}</p>
                  {r.nPezzi > 1 && (
                    <p className="text-indigo-200 text-xs mt-1">circa €{(r.prezzo / r.nPezzi).toFixed(2)} a pezzo</p>
                  )}
                  {risparmio >= 1 && (
                    <p className="text-sm mt-3 text-white">
                      Risparmi circa <strong>€{Math.round(risparmio)}</strong> rispetto a ordinarli uno alla volta
                      {r.scontoPct > 0 && <span className="text-indigo-200"> (incluso sconto quantità −{r.scontoPct}%)</span>}
                    </p>
                  )}
                  {r.prossimoSconto && (
                    <p className="text-xs mt-2 bg-white/10 rounded-lg px-3 py-2 text-indigo-100">
                      Aggiungi {r.prossimoSconto.pezziMancanti} {r.prossimoSconto.pezziMancanti === 1 ? 'pezzo' : 'pezzi'} per
                      uno sconto del {r.prossimoSconto.scontoPct}% su tutto l&apos;ordine
                    </p>
                  )}
                  <p className="text-indigo-200 text-xs mt-3">{profilo.nome}</p>
                </div>
              </div>

              {admin ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="font-bold text-gray-900 mb-3">Dettaglio costi</h2>

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">Stampa</p>
                  <Voce label="Materiale" sub={`${r.pesoG.toFixed(1)} g con supporti`} value={eur(r.costoMateriale)} />
                  <Voce
                    label="Elettricità"
                    sub={`${r.oreStampa.toFixed(2)} h · ${r.piatti.map((p) => `${p.pezzi} pz su ${p.layer.toLocaleString('it')} layer`).join(' + ')}`}
                    value={eur(r.costoElettricita)}
                  />
                  <Voce label="Usura macchina" value={eur(r.costoMacchina)} />
                  <Voce label="Costi vivi" value={eur(r.costiVivi)} forte />
                  <Voce
                    label={r.minimoApplicato ? 'Prezzo stampa (minimo applicato)' : `Prezzo stampa (+${profilo.markupPct}% markup)`}
                    value={eur(r.prezzoStampa)}
                  />
                  {r.quotaCommissione > 0 && (
                    <Voce label={`Ricarico commissione negozio (${percentualeNegozio}%)`} sub="solo sulla parte stampa" value={`+${eur(r.quotaCommissione)}`} />
                  )}

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-4">Lavoro manuale</p>
                  {righe.map((rg, i) => {
                    const rr = r.righe[i]
                    return (
                      <Voce
                        key={rg.id}
                        label={`${rr.quantita}× ${rg.nome}`}
                        sub={`${finituraDi(rg)?.oreLavoro ?? 0} h × ${rr.fattoreDimensione.toFixed(2)} dimensione (${rr.superficieCm2.toFixed(0)} cm²) = ${rr.oreLavoroPezzo.toFixed(2)} h/pz · ${rr.oreLavoroReali.toFixed(1)} h totali`}
                        value={eur(rr.prezzoLavoro)}
                      />
                    )
                  })}
                  <Voce
                    label="Lavoro"
                    sub={r.oreLavoroReali > 0 ? `${r.oreLavoroReali.toFixed(1)} h reali · tariffa effettiva ${eur(r.prezzoLavoro / r.oreLavoroReali)}/h` : undefined}
                    value={eur(r.prezzoLavoro)}
                    forte
                  />

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-4">Totale</p>
                  <Voce label="Subtotale" value={eur(r.subtotale)} />
                  {r.scontoPct > 0 && <Voce label={`Sconto quantità (−${r.scontoPct}%, ${r.nPezzi} pezzi)`} value={`−${eur(r.sconto)}`} />}
                  <Voce label="Prezzo centrale" sub={`range mostrato al pubblico: ${prezzoStr}`} value={eur(r.prezzo)} forte />
                  {r.prezzoPezziSingoli != null && <Voce label="Se ordinati uno alla volta" value={eur(r.prezzoPezziSingoli)} />}
                  <Voce label="Netto vendita diretta" sub={`guadagno sui costi vivi: ${eur(r.prezzo - r.costiVivi)}`} value={eur(r.prezzo)} />
                  {percentualeNegozio > 0 && (
                    <Voce
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
                      Tempi e supporti dipendono dall&apos;orientamento reale dei pezzi e dalle impostazioni di stampa.
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
              <p className="text-sm">Carica uno o più file STL per vedere la stima</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
