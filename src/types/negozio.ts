import type { SanityImageSource } from '@sanity/image-url'

/** Riferimento leggero a una miniatura, arricchito con quanto serve per mostrarla nelle pagine negozio/admin. */
export interface MiniaturaRef {
  _id: string
  nome: string
  codice?: string
  slug?: { current: string }
  immagine?: SanityImageSource
}

/** Riga di giacenza calcolata (somma dei movimenti), non un documento Sanity a sé. */
export interface GiacenzaNegozio {
  _key: string
  miniatura?: MiniaturaRef
  varianteNome?: string
  quantita: number
  prezzo?: number
  prezzoScontato?: number
}

export interface Negozio {
  _id: string
  nome: string
  slug: { current: string }
  indirizzo?: string
  percentualeNegozio?: number
  attivo?: boolean
  visibilePubblicamente?: boolean
  immagine?: SanityImageSource
}

export interface MovimentoGiacenza {
  _id: string
  negozio?: { _id: string; nome: string }
  miniatura?: MiniaturaRef
  varianteNome?: string
  quantita: number
  motivo: 'consegna' | 'ritiro' | 'vendita_confermata' | 'rettifica'
  data?: string
  note?: string
}

export interface VenditaSegnalata {
  _id: string
  negozio?: { _id: string; nome: string }
  miniatura?: MiniaturaRef
  varianteNome?: string
  quantita: number
  prezzoListino?: number
  prezzoStimato?: number
  offertaUsata?: boolean
  scontoExtra?: number
  data?: string
  note?: string
  stato: 'segnalata' | 'confermata'
  ordineCollegato?: { _id: string }
}
