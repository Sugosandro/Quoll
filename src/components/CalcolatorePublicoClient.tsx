'use client'

import { useState, useCallback, useEffect } from 'react'
import { parseSTL } from '@/utils/stlParser'
import type { ProfiloPrezzo } from '@/types/miniatura'

const SCALE = [50, 75, 100, 125, 150, 200]
const MAX_SIZE_MB = 500
const RESIN_LAYER_HEIGHT_MM = 0.05   // 50 micron
const RESIN_SECONDS_PER_LAYER = 4

const SUPPORTI = [
  { id: 'nessuno', label: 'Senza supporti',   overhead: 0,  desc: 'Geometria semplice, quasi nessuna superficie in sbalzo' },
  { id: 'leggeri', label: 'Supporti leggeri',  overhead: 15, desc: 'Alcune zone in sbalzo, supporti limitati (+15% materiale)' },
  { id: 'medi',    label: 'Supporti medi',     overhead: 30, desc: 'Diverse zone in sbalzo (+30% materiale)' },
  { id: 'pesanti', label: 'Supporti pesanti',  overhead: 50, desc: 'Geometria complessa o parti capovolte (+50% materiale)' },
] as const
type SupportiId = typeof SUPPORTI[number]['id']
type Tecnologia = 'fff' | 'resina'

function categoriaFromRatio(ratio: number): SupportiId {
  if (ratio < 0.05) return 'nessuno'
  if (ratio < 0.20) return 'leggeri'
  if (ratio < 0.40) return 'medi'
  return 'pesanti'
}

interface FileInfo {
  name: string
  volumeMm3: number
  triangles: number
  overhangRatio: number
  boundingBox: { x: number; y: number; z: number }
}

interface Props { profili: ProfiloPrezzo[]; percentualeNegozio?: number }

export default function CalcolatorePublicoClient({ profili, percentualeNegozio = 0 }: Props) {
  const [file, setFile]               = useState<FileInfo | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [dragging, setDragging]       = useState(false)
  const [supportiOverride, setSupportiOverride] = useState<SupportiId | null>(null)
  const [tecnologia, setTecnologia]   = useState<Tecnologia>('fff')

  const [profiloId, setProfiloId]   = useState<string>(profili[0]?._id ?? '')
  const [finituraId, setFinituraId] = useState<string>(profili[0]?.finiture?.[0]?._id ?? '')
  const [infill, setInfill]         = useState(20)
  const [scala, setScala]           = useState(100)

  const processFile = useCallback(async (f: File) => {
    setError(null)
    setSupportiOverride(null)
    if (!f.name.toLowerCase().endsWith('.stl')) { setError('Formato non supportato. Carica un file .stl'); return }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) { setError(`File troppo grande. Massimo ${MAX_SIZE_MB} MB.`); return }
    setLoading(true)
    try {
      const buffer = await f.arrayBuffer()
      const { volumeMm3, triangleCount, overhangRatio, boundingBox } = parseSTL(buffer)
      if (volumeMm3 === 0) throw new Error('Volume zero — verifica che il file STL sia valido.')
      setFile({ name: f.name, volumeMm3, triangles: triangleCount, overhangRatio, boundingBox })
    } catch (e: any) {
      setError(e.message ?? 'Errore nel parsing del file STL.')
    } finally {
      setLoading(false)
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [processFile])

  const autoCategoria: SupportiId | null = file ? categoriaFromRatio(file.overhangRatio) : null
  const categoriaId = supportiOverride ?? autoCategoria ?? 'nessuno'
  const categoria = SUPPORTI.find(s => s.id === categoriaId)!

  const profilo = profili.find(p => p._id === profiloId) ?? profili[0]
  const finitureDelProfilo = profilo?.finiture ?? []
  const finituraSelezionata = finitureDelProfilo.find(f => f._id === finituraId) ?? finitureDelProfilo[0]

  useEffect(() => {
    const prima = profilo?.finiture?.[0]
    if (prima) setFinituraId(prima._id)
  }, [profiloId])

  const scaleFactor = scala / 100
  const volumeCm3 = file ? (file.volumeMm3 / 1000) * Math.pow(scaleFactor, 3) : null

  // Dimensione maggiore scalata (per resina)
  const dimMaxMm = file
    ? Math.max(file.boundingBox.x, file.boundingBox.y, file.boundingBox.z) * scaleFactor
    : null

  // Peso: FFF usa infill, resina è tendenzialmente solida
  const infillFactor = tecnologia === 'fff' ? (0.15 + (infill / 100) * 0.85) : 1
  const pesoBase = volumeCm3 !== null && profilo ? volumeCm3 * profilo.densita * infillFactor : null
  const pesoG = pesoBase !== null ? pesoBase * (1 + categoria.overhead / 100) : null

  // Ore di stampa
  let oreStampa: number | null = null
  let oreStimateMsg = ''
  if (tecnologia === 'fff' && profilo && pesoG !== null) {
    oreStampa = pesoG / profilo.velocitaStampaGh
    oreStimateMsg = `${oreStampa.toFixed(1)} h di stampa stimate`
  } else if (tecnologia === 'resina' && dimMaxMm !== null) {
    const layers = dimMaxMm / RESIN_LAYER_HEIGHT_MM
    oreStampa = (layers * RESIN_SECONDS_PER_LAYER) / 3600
    oreStimateMsg = `${Math.round(dimMaxMm / RESIN_LAYER_HEIGHT_MM).toLocaleString('it')} layer · ${oreStampa.toFixed(1)} h stimate`
  }

  let prezzoBase: number | null = null
  if (profilo && pesoG !== null && oreStampa !== null) {
    const oreLav = finituraSelezionata?.oreLavoro ?? 0
    const costoMat    = (pesoG / 1000) * profilo.costoFilamentoKg
    const costoElettr = (profilo.wattaggioW / 1000) * oreStampa * profilo.costoKwh
    const costoLav    = oreLav * profilo.costoOraLavoro
    const totaleCosti = costoMat + costoElettr + costoLav
    prezzoBase = Math.max(profilo.prezzoMinimo, totaleCosti * (1 + profilo.markupPct / 100))
  }

  // Applica commissione negozio: il prezzo esposto deve coprire anche la % trattenuta
  const applyCommissione = (p: number) =>
    percentualeNegozio > 0 ? p / (1 - percentualeNegozio / 100) : p

  const prezzoMin = prezzoBase !== null ? applyCommissione(Math.max(profilo!.prezzoMinimo, prezzoBase * 0.75)) : null
  const prezzoMax = prezzoBase !== null ? applyCommissione(prezzoBase * 1.25) : null

  const whatsappMsg = file && pesoBase !== null && profilo
    ? encodeURIComponent(
        `Ciao! Ho usato il calcolatore sul sito.\n\nFile: ${file.name}\nTecnologia: ${tecnologia === 'fff' ? 'FFF/Filamento' : 'Resina'}\nMateriale: ${profilo.nome} — ${finituraSelezionata?.nome ?? ''}\nScala: ${scala}%${tecnologia === 'fff' ? ` · Infill: ${infill}%` : ''}\nSupporti: ${categoria.label}\nPeso stimato: ${pesoG!.toFixed(1)}g\nStima prezzo: €${prezzoMin!.toFixed(2)} – €${prezzoMax!.toFixed(2)}\n\nPotete darmi un preventivo reale?`
      )
    : encodeURIComponent('Ciao! Vorrei un preventivo per una miniatura stampata in 3D.')

  if (profili.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-amber-800 text-sm">
        Nessun profilo di prezzo configurato. Vai in Studio → Profili di prezzo per crearne uno.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Privacy */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
        <svg className="w-5 h-5 text-green-500 flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span><strong>Privacy garantita:</strong> il file viene elaborato nel browser e non viene mai caricato su alcun server.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sinistra */}
        <div className="space-y-6">

          {/* Tecnologia */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Tecnologia di stampa</p>
            <div className="flex gap-2">
              {([
                { id: 'fff',    label: 'FFF / Filamento', desc: 'PLA, PETG, ABS…' },
                { id: 'resina', label: 'Resina (MSLA)',    desc: 'Calcolo basato sull\'altezza del modello' },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setTecnologia(t.id)}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    tecnologia === t.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-200'
                  }`}>
                  <p className={`text-sm font-medium ${tecnologia === t.id ? 'text-indigo-700' : 'text-gray-700'}`}>{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

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
              ) : file ? (
                <>
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-green-700">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(file.volumeMm3 / 1000).toFixed(2)} cm³ · {file.boundingBox.x.toFixed(1)}×{file.boundingBox.y.toFixed(1)}×{file.boundingBox.z.toFixed(1)} mm
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
          </div>

          {/* Supporti */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Supporti di stampa</p>
              {file && autoCategoria && !supportiOverride && (
                <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  rilevato automaticamente · {Math.round(file.overhangRatio * 100)}% sbalzo
                </span>
              )}
              {supportiOverride && (
                <button onClick={() => setSupportiOverride(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  ripristina auto
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTI.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSupportiOverride(s.id === autoCategoria && !supportiOverride ? null : s.id)}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                    categoriaId === s.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <p className={`text-sm font-medium ${categoriaId === s.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Profilo / Materiale */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Materiale</p>
            <div className="flex flex-wrap gap-2">
              {profili.map(p => (
                <button key={p._id} onClick={() => setProfiloId(p._id)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    profiloId === p._id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                  }`}>
                  {p.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Finitura */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Finitura</p>
            {finitureDelProfilo.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {finitureDelProfilo.map(f => (
                  <button key={f._id} onClick={() => setFinituraId(f._id)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      finituraId === f._id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                    }`}>
                    {f.nome}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Nessuna finitura associata a questo profilo. Aggiungila in Studio → Profili di prezzo.
              </p>
            )}
          </div>

          {/* Infill — solo FFF */}
          {tecnologia === 'fff' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Riempimento interno (infill)</p>
                <span className="text-sm font-bold text-indigo-600">{infill}%</span>
              </div>
              <input type="range" min={10} max={100} step={5} value={infill}
                onChange={e => setInfill(Number(e.target.value))}
                className="w-full accent-indigo-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10% (leggero)</span><span>50% (standard)</span><span>100% (solido)</span>
              </div>
            </div>
          )}

          {/* Info resina */}
          {tecnologia === 'resina' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
              Il tempo di stampa a resina è calcolato sulla <strong>dimensione maggiore del modello</strong> con layer da <strong>50 µm</strong> e <strong>4 s/layer</strong>.
              La stampa a resina non ha infill — il modello è tendenzialmente solido o svuotato manualmente.
            </div>
          )}

          {/* Scala */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Scala di stampa</p>
            <div className="flex flex-wrap gap-2">
              {SCALE.map(s => (
                <button key={s} onClick={() => setScala(s)}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    scala === s
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                  }`}>
                  {s}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Destra — risultati */}
        <div className="space-y-4">
          {file && prezzoBase !== null ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h2 className="font-bold text-gray-900">Stima</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Volume</p>
                    <p className="text-base font-bold text-gray-800">{volumeCm3!.toFixed(2)} cm³</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">{tecnologia === 'resina' ? 'Dim. maggiore' : 'Peso + supporti'}</p>
                    <p className="text-base font-bold text-gray-800">
                      {tecnologia === 'resina' ? `${dimMaxMm!.toFixed(1)} mm` : `${pesoG!.toFixed(1)} g`}
                    </p>
                    {categoria.overhead > 0 && (
                      <p className="text-xs text-orange-500 mt-0.5">+{categoria.overhead}% supporti</p>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Ore stimate</p>
                    <p className="text-base font-bold text-gray-800">{oreStampa!.toFixed(1)} h</p>
                  </div>
                </div>
                <div className="bg-indigo-600 rounded-xl p-5 text-white">
                  <p className="text-indigo-200 text-sm mb-1">Prezzo indicativo</p>
                  <p className="text-3xl font-bold">€{prezzoMin!.toFixed(2)} – €{prezzoMax!.toFixed(2)}</p>
                  <p className="text-indigo-200 text-xs mt-2">
                    {profilo?.nome} · {finituraSelezionata?.nome} · scala {scala}%{tecnologia === 'fff' ? ` · infill ${infill}%` : ''}
                  </p>
                  <p className="text-indigo-300 text-xs mt-0.5">{categoria.label} · {oreStimateMsg}</p>
                  {percentualeNegozio > 0 && (
                    <p className="text-indigo-300 text-xs mt-1">
                      Commissione negozio ({percentualeNegozio}%) già inclusa nel prezzo
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">Solo una stima indicativa</p>
                <p className="leading-relaxed">
                  {tecnologia === 'resina'
                    ? "Il tempo reale dipende dall'orientamento del pezzo, dal tipo di resina e dalle impostazioni della stampante."
                    : "I supporti sono stimati dall'analisi geometrica, ma dipendono dall'orientamento reale del pezzo nello slicer."}
                  {' '}Il prezzo finale viene concordato dopo il preventivo con slicer reale.
                </p>
              </div>
              <a href={`https://wa.me/393338479871?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Richiedi preventivo reale
              </a>
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
