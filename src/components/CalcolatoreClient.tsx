'use client'

import { useState, useMemo } from 'react'
import type { ProfiloPrezzo } from '@/types/miniatura'

type Tecnologia = 'fff' | 'resina'

interface Props { profili: ProfiloPrezzo[] }

function Field({ label, hint, value, onChange, min = 0, max, step = 1, prefix, suffix }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; prefix?: string; suffix?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="ml-1.5 text-xs text-gray-400 font-normal">{hint}</span>}
      </label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-gray-500">{prefix}</span>}
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition" />
        {suffix && <span className="text-sm text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${highlight ? 'border-t border-gray-200 mt-1 pt-3' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
      <span className={`font-semibold ${highlight ? 'text-indigo-700 text-lg' : 'text-gray-700 text-sm'}`}>{value}</span>
    </div>
  )
}

export default function CalcolatoreClient({ profili }: Props) {
  const [tecnologia, setTecnologia]       = useState<Tecnologia>('fff')
  const [peso, setPeso]                   = useState(50)
  const [costoFilamento, setCostoFil]     = useState(22)
  const [oreStampaManual, setOreStampaManual] = useState(4)
  const [altezzaMm, setAltezzaMm]         = useState(40)
  const [wattaggioStampante, setWatt]     = useState(150)
  const [costoKwh, setCostoKwh]           = useState(0.25)
  const [oreLavoro, setOreLavoro]         = useState(1)
  const [costoOraLavoro, setCostoOraLav]  = useState(14)
  const [markup, setMarkup]               = useState(40)
  const [commissione, setCommissione]     = useState(0)
  const [profiloAttivoId, setProfiloAttivoId] = useState<string | null>(null)

  const oreStampa = useMemo(() => {
    if (tecnologia === 'resina') return (altezzaMm / 0.05) * 4 / 3600
    return oreStampaManual
  }, [tecnologia, altezzaMm, oreStampaManual])

  const profiloAttivo = profili.find(p => p._id === profiloAttivoId) ?? null

  const applicaProfilo = (p: ProfiloPrezzo) => {
    setProfiloAttivoId(p._id)
    setCostoFil(p.costoFilamentoKg)
    setWatt(p.wattaggioW)
    setCostoKwh(p.costoKwh)
    setCostoOraLav(p.costoOraLavoro)
    setMarkup(p.markupPct)
  }

  const costoMateriale    = (peso / 1000) * costoFilamento
  const costoElettr       = (wattaggioStampante / 1000) * oreStampa * costoKwh
  const costoLavoro       = oreLavoro * costoOraLavoro
  const totaleProduzione  = costoMateriale + costoElettr + costoLavoro
  // La commissione è trattata come costo: quota da mettere da parte su ogni € di produzione
  // affinché dopo che la piattaforma trattiene la sua %, rimanga esattamente il totale produzione
  const quotaCommissione  = commissione > 0 ? totaleProduzione * commissione / (100 - commissione) : 0
  const totaleCosti       = totaleProduzione + quotaCommissione
  const markupEuro        = totaleCosti * markup / 100
  const prezzoEsposto     = totaleCosti * (1 + markup / 100)
  // Quanto incassi davvero dopo che la piattaforma trattiene la sua %
  const tuoIncasso        = prezzoEsposto * (1 - commissione / 100)

  const fmt = (n: number) => `€${n.toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Selezione profilo + finitura */}
      {profili.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Profilo materiale
              <span className="ml-1.5 text-xs text-gray-400 font-normal">— pre-compila i parametri</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {profili.map(p => (
                <button key={p._id} onClick={() => applicaProfilo(p)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    profiloAttivoId === p._id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50'
                  }`}>
                  {p.nome}
                </button>
              ))}
            </div>
          </div>

          {profiloAttivo && (profiloAttivo.finiture?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Finitura
                <span className="ml-1.5 text-xs text-gray-400 font-normal">— pre-compila le ore di lavoro</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {profiloAttivo.finiture!.map(f => (
                  <button key={f._id} onClick={() => setOreLavoro(f.oreLavoro)}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all">
                    {f.nome}
                    <span className="ml-1.5 text-xs text-gray-400">{f.oreLavoro}h</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg">Parametri stampa</h2>
            <div className="flex gap-1.5">
              {(['fff', 'resina'] as Tecnologia[]).map(t => (
                <button key={t} onClick={() => setTecnologia(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    tecnologia === t
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200'
                  }`}>
                  {t === 'fff' ? 'FFF' : 'Resina'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Materiale</p>
            <Field label={tecnologia === 'fff' ? 'Peso filamento' : 'Peso resina'} value={peso} onChange={setPeso} min={1} max={1000} suffix="g" />
            <Field label={tecnologia === 'fff' ? 'Costo filamento' : 'Costo resina'} value={costoFilamento} onChange={setCostoFil} min={1} step={0.5} prefix="€" suffix="/ kg" />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Elettricità</p>
            {tecnologia === 'fff' ? (
              <Field label="Ore di stampa" hint="(dallo slicer)" value={oreStampaManual} onChange={setOreStampaManual} min={0.1} step={0.5} suffix="h" />
            ) : (
              <>
                <Field label="Altezza modello" hint="(dimensione maggiore)" value={altezzaMm} onChange={setAltezzaMm} min={1} max={300} suffix="mm" />
                <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 rounded-lg">
                  <span className="text-sm text-gray-600">Ore di stampa calcolate</span>
                  <span className="text-sm font-bold text-indigo-700">{oreStampa.toFixed(2)} h</span>
                </div>
                <p className="text-xs text-gray-400">Layer 50 µm · 4 s/layer · {Math.round(altezzaMm / 0.05).toLocaleString('it')} layer totali</p>
              </>
            )}
            <Field label="Wattaggio stampante" value={wattaggioStampante} onChange={setWatt} min={50} max={1000} suffix="W" />
            <Field label="Costo energia" value={costoKwh} onChange={setCostoKwh} min={0.01} step={0.01} prefix="€" suffix="/ kWh" />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Lavoro manuale</p>
            <Field label="Ore di finitura" hint="(primer, pittura, supporti…)" value={oreLavoro} onChange={setOreLavoro} min={0} step={0.5} suffix="h" />
            <Field label="Costo orario" value={costoOraLavoro} onChange={setCostoOraLav} min={1} prefix="€" suffix="/ h" />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Margine</p>
            <Field label="Markup" value={markup} onChange={setMarkup} min={0} max={500} suffix="%" />
            <Field label="Commissione piattaforma" hint="(es. Etsy, Amazon)" value={commissione} onChange={setCommissione} min={0} max={60} step={0.5} suffix="%" />
          </div>
        </div>

        {/* Risultati */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Riepilogo costi</h2>
            <Row label="Materiale" value={fmt(costoMateriale)} />
            <Row label="Elettricità" value={fmt(costoElettr)} />
            <Row label="Lavoro manuale" value={fmt(costoLavoro)} />
            {commissione > 0 && (
              <Row label={`Commissione (${commissione}%)`} value={fmt(quotaCommissione)} />
            )}
            <Row label="Totale costi" value={fmt(totaleCosti)} highlight />
            <div className="mt-3">
              <Row label={`Markup (${markup}%)`} value={`+${fmt(markupEuro)}`} />
            </div>
          </div>

          <div className="bg-indigo-600 rounded-2xl p-6 text-white">
            <p className="text-indigo-200 text-sm mb-1">Prezzo da esporre</p>
            <p className="text-4xl font-bold">{fmt(prezzoEsposto)}</p>
            {commissione > 0 && (
              <p className="text-indigo-300 text-xs mt-2">
                Tuo incasso netto (dopo commissione): {fmt(tuoIncasso)}
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-2">Note</p>
            <ul className="space-y-1 list-disc list-inside leading-relaxed">
              <li>Il peso del filamento è quello effettivamente consumato dallo slicer.</li>
              <li>Le ore di stampa si leggono dallo slicer prima di avviare la stampa.</li>
              <li>Seleziona un profilo sopra per pre-compilare i parametri standard.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
