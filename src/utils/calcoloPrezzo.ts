import type { ProfiloPrezzo, Finitura, Tecnologia } from '@/types/miniatura'

// Valori usati quando un profilo non ha ancora il campo compilato in Studio.
// Tarati per sovrastimare leggermente: meglio un preventivo che scende che uno che sale.
export const DEFAULT_TECNOLOGIA: Record<Tecnologia, { altezzaLayerMm: number; secondiPerLayer: number; minutiAvvio: number }> = {
  fff:    { altezzaLayerMm: 0.1,  secondiPerLayer: 10,  minutiAvvio: 10 },
  resina: { altezzaLayerMm: 0.05, secondiPerLayer: 6.5, minutiAvvio: 10 },
}
const DEFAULT_FATTORE_RIEMPIMENTO = 0.7
const DEFAULT_COSTO_ORA_MACCHINA = 0.3
const DEFAULT_ESPONENTE_CURVA_LAVORO = 0.75
const DEFAULT_SUPERFICIE_RIF_CM2 = 32 // mini standard 28–32 mm

// Il lavoro cresce meno che proporzionalmente alla superficie: zone grandi si dipingono più in fretta
const ESPONENTE_DIMENSIONE = 0.7
const FATTORE_DIMENSIONE_MIN = 0.5

const RANGE_MIN = 0.9
const RANGE_MAX = 1.2

export const SUPPORTI = [
  { id: 'nessuno', label: 'Senza supporti',   overhead: 0,  desc: 'Geometria semplice, quasi nessuna superficie in sbalzo' },
  { id: 'leggeri', label: 'Supporti leggeri', overhead: 15, desc: 'Alcune zone in sbalzo (+15% materiale)' },
  { id: 'medi',    label: 'Supporti medi',    overhead: 30, desc: 'Diverse zone in sbalzo (+30% materiale)' },
  { id: 'pesanti', label: 'Supporti pesanti', overhead: 50, desc: 'Geometria complessa o parti capovolte (+50% materiale)' },
] as const
export type SupportiId = typeof SUPPORTI[number]['id']

export function categoriaSupporti(overhangRatio: number): SupportiId {
  if (overhangRatio < 0.05) return 'nessuno'
  if (overhangRatio < 0.20) return 'leggeri'
  if (overhangRatio < 0.40) return 'medi'
  return 'pesanti'
}

export interface Geometria {
  volumeMm3: number
  superficieMm2: number
  boundingBox: { x: number; y: number; z: number }
}

export interface InputCalcolo {
  geometria: Geometria
  profilo: ProfiloPrezzo
  finitura?: Finitura
  scalaPct: number
  supporti: SupportiId
  percentualeNegozio: number
}

export interface RisultatoCalcolo {
  tecnologia: Tecnologia
  volumeCm3: number
  superficieCm2: number
  dimMaxMm: number
  pesoG: number
  layer: number
  oreStampa: number
  costoMateriale: number
  costoElettricita: number
  costoMacchina: number
  costiVivi: number
  prezzoStampa: number          // costi vivi + markup, almeno il minimo
  minimoApplicato: boolean
  quotaCommissione: number      // ricarico per coprire la % negozio, solo sulla stampa
  fattoreDimensione: number
  oreLavoroReali: number
  oreLavoroFatturate: number
  prezzoLavoro: number
  prezzo: number
  prezzoMin: number
  prezzoMax: number
}

export function tecnologiaProfilo(p: ProfiloPrezzo): Tecnologia {
  return p.tecnologia ?? 'fff'
}

// Prima ora piena, poi ogni ora pesa un po' meno della precedente
export function oreFatturate(ore: number, esponente: number): number {
  return ore <= 1 ? ore : Math.pow(ore, esponente)
}

export function calcolaPrezzo({ geometria, profilo, finitura, scalaPct, supporti, percentualeNegozio }: InputCalcolo): RisultatoCalcolo {
  const tecnologia = tecnologiaProfilo(profilo)
  const def = DEFAULT_TECNOLOGIA[tecnologia]
  const s = scalaPct / 100

  const volumeCm3 = (geometria.volumeMm3 / 1000) * s ** 3
  const superficieCm2 = (geometria.superficieMm2 / 100) * s ** 2
  // Dimensione maggiore: copre sia la stampa in piedi (FFF) sia quella inclinata (resina)
  const { x, y, z } = geometria.boundingBox
  const dimMaxMm = Math.max(x, y, z) * s

  // — Stampa —
  const riempimento = tecnologia === 'fff' ? (profilo.fattoreRiempimento ?? DEFAULT_FATTORE_RIEMPIMENTO) : 1
  const overhead = SUPPORTI.find((c) => c.id === supporti)!.overhead
  const pesoG = volumeCm3 * profilo.densita * riempimento * (1 + overhead / 100)

  const altezzaLayer = profilo.altezzaLayerMm ?? def.altezzaLayerMm
  const secondiPerLayer = profilo.secondiPerLayer ?? def.secondiPerLayer
  const minutiAvvio = profilo.minutiAvvio ?? def.minutiAvvio
  const layer = Math.ceil(dimMaxMm / altezzaLayer)
  let oreStampa = minutiAvvio / 60 + (layer * secondiPerLayer) / 3600
  // In FFF anche la quantità di materiale estruso richiede tempo; in resina un layer costa uguale a prescindere
  if (tecnologia === 'fff' && profilo.velocitaStampaGh > 0) oreStampa += pesoG / profilo.velocitaStampaGh

  const costoMateriale = (pesoG / 1000) * profilo.costoFilamentoKg
  const costoElettricita = (profilo.wattaggioW / 1000) * oreStampa * profilo.costoKwh
  const costoMacchina = oreStampa * (profilo.costoOraMacchina ?? DEFAULT_COSTO_ORA_MACCHINA)
  const costiVivi = costoMateriale + costoElettricita + costoMacchina

  const prezzoStampaCalcolato = costiVivi * (1 + profilo.markupPct / 100)
  const minimoApplicato = prezzoStampaCalcolato < profilo.prezzoMinimo
  const prezzoStampa = Math.max(profilo.prezzoMinimo, prezzoStampaCalcolato)
  const quotaCommissione = percentualeNegozio > 0 && percentualeNegozio < 100
    ? prezzoStampa * percentualeNegozio / (100 - percentualeNegozio)
    : 0

  // — Lavoro manuale (nessun markup né commissione: è già il compenso) —
  const superficieRif = profilo.superficieRiferimentoCm2 ?? DEFAULT_SUPERFICIE_RIF_CM2
  const fattoreDimensione = Math.max(FATTORE_DIMENSIONE_MIN, Math.pow(superficieCm2 / superficieRif, ESPONENTE_DIMENSIONE))
  const oreLavoroReali = (finitura?.oreLavoro ?? 0) * fattoreDimensione
  const oreLavoroFatt = oreFatturate(oreLavoroReali, profilo.esponenteCurvaLavoro ?? DEFAULT_ESPONENTE_CURVA_LAVORO)
  const prezzoLavoro = oreLavoroFatt * profilo.costoOraLavoro

  const prezzo = prezzoStampa + quotaCommissione + prezzoLavoro

  return {
    tecnologia, volumeCm3, superficieCm2, dimMaxMm, pesoG, layer, oreStampa,
    costoMateriale, costoElettricita, costoMacchina, costiVivi,
    prezzoStampa, minimoApplicato, quotaCommissione,
    fattoreDimensione, oreLavoroReali, oreLavoroFatturate: oreLavoroFatt, prezzoLavoro,
    prezzo,
    prezzoMin: Math.max(1, Math.round(prezzo * RANGE_MIN)),
    prezzoMax: Math.max(1, Math.round(prezzo * RANGE_MAX)),
  }
}
