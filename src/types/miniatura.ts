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
  bestSeller?: boolean
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
  videoUrls?: string[]
  varianti?: Variante[]
}

export type MiniatureListItem = Pick<
  Miniatura,
  '_id' | 'nome' | 'slug' | 'immagini' | 'scala' | 'genere' | 'tipo' | 'varianti' | 'bestSeller'
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
  videoUrl?: string
  titolo?: string
  sottotitolo?: string
}

export interface SiteSettings {
  percentualeNegozio?: number
  heroSlides?: HeroSlide[]
}

export interface ProfiloPrezzo {
  _id: string
  nome: string
  materiale?: string
  visibileAlPubblico?: boolean
  densita: number
  costoFilamentoKg: number
  velocitaStampaGh: number
  wattaggioW: number
  costoKwh: number
  costoOraLavoro: number
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
