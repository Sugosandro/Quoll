import type { ProfiloPrezzo, Finitura, Tecnologia, ScontoQuantita } from '@/types/miniatura'

// Valori usati quando un profilo non ha ancora il campo compilato in Studio.
// Tarati per sovrastimare leggermente: meglio un preventivo che scende che uno che sale.
export const DEFAULT_TECNOLOGIA: Record<Tecnologia, {
  altezzaLayerMm: number; secondiPerLayer: number; minutiAvvio: number; areaPiattoCm2: number
}> = {
  fff:    { altezzaLayerMm: 0.1,  secondiPerLayer: 10,  minutiAvvio: 10, areaPiattoCm2: 400 },
  resina: { altezzaLayerMm: 0.05, secondiPerLayer: 6.5, minutiAvvio: 10, areaPiattoCm2: 150 },
}
const DEFAULT_FATTORE_RIEMPIMENTO = 0.7
const DEFAULT_COSTO_ORA_MACCHINA = 0.3
const DEFAULT_ESPONENTE_CURVA_LAVORO = 0.75
const DEFAULT_SUPERFICIE_RIF_CM2 = 32 // mini standard 28–32 mm
const DEFAULT_FATTORE_COPIE = 0.7

// Il lavoro cresce meno che proporzionalmente alla superficie: zone grandi si dipingono più in fretta
const ESPONENTE_DIMENSIONE = 0.7
const FATTORE_DIMENSIONE_MIN = 0.5
// Ingombro sul piatto rispetto alla base del modello: spaziatura, supporti, inclinazione
const MARGINE_INGOMBRO = 1.3

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

export interface RigaOrdine {
  geometria: Geometria
  finitura?: Finitura
  scalaPct: number
  quantita: number
  supporti: SupportiId
}

export interface InputOrdine {
  righe: RigaOrdine[]
  profilo: ProfiloPrezzo
  percentualeNegozio: number
  scontiQuantita?: ScontoQuantita[]
}

export interface RisultatoRiga {
  quantita: number
  volumeCm3: number
  superficieCm2: number
  dimMaxMm: number
  ingombroCm2: number
  pesoG: number               // per pezzo
  fattoreDimensione: number
  oreLavoroPezzo: number      // ore reali per un pezzo
  oreLavoroReali: number      // ore reali per tutte le copie (le copie dopo la prima costano meno)
  prezzoLavoro: number        // per tutte le copie
}

export interface Piatto {
  pezzi: number
  altezzaMm: number
  areaUsataCm2: number
  layer: number
  ore: number
}

export interface RisultatoOrdine {
  tecnologia: Tecnologia
  righe: RisultatoRiga[]
  piatti: Piatto[]
  nPezzi: number
  pesoG: number
  oreStampa: number
  costoMateriale: number
  costoElettricita: number
  costoMacchina: number
  costiVivi: number
  prezzoStampa: number          // costi vivi + markup, almeno il minimo
  minimoApplicato: boolean
  quotaCommissione: number      // ricarico per coprire la % negozio, solo sulla stampa
  oreLavoroReali: number
  prezzoLavoro: number
  subtotale: number
  scontoPct: number
  sconto: number
  prossimoSconto: { pezziMancanti: number; scontoPct: number } | null
  prezzo: number
  prezzoMin: number
  prezzoMax: number
  /** Somma dei prezzi se ogni pezzo venisse ordinato da solo (solo per ordini con più pezzi) */
  prezzoPezziSingoli: number | null
}

export function tecnologiaProfilo(p: ProfiloPrezzo): Tecnologia {
  return p.tecnologia ?? 'fff'
}

// Prima ora piena, poi ogni ora pesa un po' meno della precedente
export function oreFatturate(ore: number, esponente: number): number {
  return ore <= 1 ? ore : Math.pow(ore, esponente)
}

function scaglioni(sconti: ScontoQuantita[] | undefined) {
  return (sconti ?? [])
    .filter((s) => s.minPezzi > 1 && s.scontoPct > 0)
    .sort((a, b) => a.minPezzi - b.minPezzi)
}

// I pezzi più alti vanno per primi: ogni piatto dura quanto il suo pezzo più alto
function disponiSuiPiatti(pezzi: { altezzaMm: number; ingombroCm2: number }[], areaPiatto: number) {
  const piatti: { altezzaMm: number; area: number; pezzi: number }[] = []
  for (const p of [...pezzi].sort((a, b) => b.altezzaMm - a.altezzaMm)) {
    const libero = piatti.find((pt) => pt.area + p.ingombroCm2 <= areaPiatto)
    if (libero) { libero.area += p.ingombroCm2; libero.pezzi++ }
    else piatti.push({ altezzaMm: p.altezzaMm, area: p.ingombroCm2, pezzi: 1 })
  }
  return piatti
}

export function calcolaOrdine({ righe, profilo, percentualeNegozio, scontiQuantita }: InputOrdine): RisultatoOrdine {
  const tecnologia = tecnologiaProfilo(profilo)
  const def = DEFAULT_TECNOLOGIA[tecnologia]
  const riempimento = tecnologia === 'fff' ? (profilo.fattoreRiempimento ?? DEFAULT_FATTORE_RIEMPIMENTO) : 1
  const superficieRif = profilo.superficieRiferimentoCm2 ?? DEFAULT_SUPERFICIE_RIF_CM2
  const esponenteLavoro = profilo.esponenteCurvaLavoro ?? DEFAULT_ESPONENTE_CURVA_LAVORO
  const fattoreCopie = profilo.fattoreCopie ?? DEFAULT_FATTORE_COPIE

  // — Per riga —
  const risRighe: RisultatoRiga[] = righe.map((r) => {
    const s = r.scalaPct / 100
    const q = Math.max(1, Math.round(r.quantita))
    const { x, y, z } = r.geometria.boundingBox
    const volumeCm3 = (r.geometria.volumeMm3 / 1000) * s ** 3
    const superficieCm2 = (r.geometria.superficieMm2 / 100) * s ** 2
    // Dimensione maggiore: copre sia la stampa in piedi (FFF) sia quella inclinata (resina)
    const dimMaxMm = Math.max(x, y, z) * s
    const ingombroCm2 = (x * y * s ** 2 / 100) * MARGINE_INGOMBRO
    const overhead = SUPPORTI.find((c) => c.id === r.supporti)!.overhead
    const pesoG = volumeCm3 * profilo.densita * riempimento * (1 + overhead / 100)

    const fattoreDimensione = Math.max(FATTORE_DIMENSIONE_MIN, Math.pow(superficieCm2 / superficieRif, ESPONENTE_DIMENSIONE))
    const oreLavoroPezzo = (r.finitura?.oreLavoro ?? 0) * fattoreDimensione
    // Le copie dello stesso modello si lavorano in serie: dalla seconda in poi costano una frazione
    const moltiplicatoreCopie = 1 + (q - 1) * fattoreCopie
    const prezzoLavoro = oreFatturate(oreLavoroPezzo, esponenteLavoro) * profilo.costoOraLavoro * moltiplicatoreCopie

    return {
      quantita: q, volumeCm3, superficieCm2, dimMaxMm, ingombroCm2, pesoG,
      fattoreDimensione, oreLavoroPezzo, oreLavoroReali: oreLavoroPezzo * moltiplicatoreCopie, prezzoLavoro,
    }
  })

  // — Stampa: tutti i pezzi dell'ordine condividono i piatti —
  const altezzaLayer = profilo.altezzaLayerMm ?? def.altezzaLayerMm
  const secondiPerLayer = profilo.secondiPerLayer ?? def.secondiPerLayer
  const minutiAvvio = profilo.minutiAvvio ?? def.minutiAvvio
  const areaPiatto = profilo.areaPiattoCm2 ?? def.areaPiattoCm2

  const pezzi = risRighe.flatMap((r) => Array.from({ length: r.quantita }, () => ({ altezzaMm: r.dimMaxMm, ingombroCm2: r.ingombroCm2 })))
  const piatti: Piatto[] = disponiSuiPiatti(pezzi, areaPiatto).map((p) => {
    const layer = Math.ceil(p.altezzaMm / altezzaLayer)
    return { pezzi: p.pezzi, altezzaMm: p.altezzaMm, areaUsataCm2: p.area, layer, ore: minutiAvvio / 60 + (layer * secondiPerLayer) / 3600 }
  })

  const nPezzi = pezzi.length
  const pesoG = risRighe.reduce((t, r) => t + r.pesoG * r.quantita, 0)
  let oreStampa = piatti.reduce((t, p) => t + p.ore, 0)
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
  const oreLavoroReali = risRighe.reduce((t, r) => t + r.oreLavoroReali, 0)
  const prezzoLavoro = risRighe.reduce((t, r) => t + r.prezzoLavoro, 0)

  // — Sconto quantità sul numero di miniature —
  const tiers = scaglioni(scontiQuantita)
  const scontoPct = tiers.filter((t) => nPezzi >= t.minPezzi).at(-1)?.scontoPct ?? 0
  const prossimo = tiers.find((t) => t.minPezzi > nPezzi)
  const subtotale = prezzoStampa + quotaCommissione + prezzoLavoro
  const sconto = subtotale * scontoPct / 100
  const prezzo = subtotale - sconto

  const prezzoPezziSingoli = nPezzi > 1
    ? righe.reduce((t, r) => t + calcolaOrdine({ righe: [{ ...r, quantita: 1 }], profilo, percentualeNegozio }).prezzo * Math.max(1, Math.round(r.quantita)), 0)
    : null

  return {
    tecnologia, righe: risRighe, piatti, nPezzi, pesoG, oreStampa,
    costoMateriale, costoElettricita, costoMacchina, costiVivi,
    prezzoStampa, minimoApplicato, quotaCommissione,
    oreLavoroReali, prezzoLavoro,
    subtotale, scontoPct, sconto,
    prossimoSconto: prossimo ? { pezziMancanti: prossimo.minPezzi - nPezzi, scontoPct: prossimo.scontoPct } : null,
    prezzo,
    prezzoMin: Math.max(1, Math.round(prezzo * RANGE_MIN)),
    prezzoMax: Math.max(1, Math.round(prezzo * RANGE_MAX)),
    prezzoPezziSingoli,
  }
}
