import type { SanityImageSource } from '@sanity/image-url'

export interface Variante {
  _key: string
  nome: string
  materiale?: string
  prezzo: number
  prezzoScontato?: number
  scadenzaSconto?: string
  disponibilita?: 'disponibile' | 'ultimi' | 'esaurito'
  quantita?: number
}

export interface Miniatura {
  _id: string
  _createdAt: string
  nome: string
  slug: { current: string }
  codice?: string
  bestSeller?: boolean
  inEvidenza?: boolean
  descrizione?: any[]
  immagini: SanityImageSource[]
  file3d?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  scala?: string | string[]
  genere?: string
  tipo?: string
  videoFiles?: { asset?: { _ref: string; url?: string; mimeType?: string } }[]
  videoUrls?: string[]
  varianti?: Variante[]
}

export type MiniatureListItem = Pick<
  Miniatura,
  '_id' | 'nome' | 'slug' | 'codice' | 'immagini' | 'scala' | 'genere' | 'tipo' | 'varianti' | 'bestSeller' | 'inEvidenza'
> & { _createdAt: string }

export interface Creator {
  _id: string
  nome: string
  piattaforma?: string
  url: string
  avatar?: SanityImageSource
  descrizione?: string
}

export interface HeroSlide {
  _key: string
  immagine?: SanityImageSource
  videoFile?: { asset?: { url?: string; mimeType?: string } }
  videoUrl?: string
  titolo?: string
  sottotitolo?: string
}

export interface ScontoQuantita {
  minPezzi: number
  scontoPct: number
}

export interface SiteSettings {
  percentualeNegozio?: number
  scontiQuantita?: ScontoQuantita[]
  heroSlides?: HeroSlide[]
}

export type Tecnologia = 'fff' | 'resina'

export interface ProfiloPrezzo {
  _id: string
  nome: string
  tecnologia?: Tecnologia
  materiale?: string
  visibileAlPubblico?: boolean
  densita: number
  costoFilamentoKg: number
  fattoreRiempimento?: number
  velocitaStampaGh: number
  altezzaLayerMm?: number
  secondiPerLayer?: number
  minutiAvvio?: number
  areaPiattoCm2?: number
  wattaggioW: number
  costoKwh: number
  costoOraMacchina?: number
  costoOraLavoro: number
  esponenteCurvaLavoro?: number
  superficieRiferimentoCm2?: number
  fattoreCopie?: number
  finiture?: Finitura[]
  markupPct: number
  prezzoMinimo: number
}

export interface Finitura {
  _id: string
  nome: string
  oreLavoro: number
}

export interface Costo {
  _id: string
  descrizione: string
  categoria: string
  importo: number
  data?: string
  note?: string
}
