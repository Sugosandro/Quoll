import { groq } from 'next-sanity'
import { client } from './client'
import type { Miniatura, MiniatureListItem, Creator, SiteSettings, Costo, ProfiloPrezzo, Finitura } from '@/types/miniatura'
import type { Negozio, VenditaSegnalata, MovimentoGiacenza } from '@/types/negozio'

/** Riferimento leggero a una miniatura con quanto serve per un link + thumbnail nelle pagine negozio/admin. */
const miniaturaRefFields = groq`_id, nome, slug, "immagine": immagini[0]`

const miniatureListFields = groq`
  _id,
  _createdAt,
  nome,
  slug,
  bestSeller,
  "immagini": immagini[0..4],
  scala,
  genere,
  tipo,
  varianti[] { _key, nome, prezzo, prezzoScontato, scadenzaSconto, disponibilita, quantita }
`

export async function getAllMiniature(): Promise<MiniatureListItem[]> {
  return client.fetch(
    groq`*[_type == "miniatura"] | order(_createdAt desc) { ${miniatureListFields} }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getMiniatureFiltrate(
  genere?: string,
  tipo?: string
): Promise<MiniatureListItem[]> {
  const conditions = ['_type == "miniatura"']
  if (genere) conditions.push(`genere == $genere`)
  if (tipo) conditions.push(`tipo == $tipo`)

  return client.fetch(
    groq`*[${conditions.join(' && ')}] | order(_createdAt desc) { ${miniatureListFields} }`,
    { genere: genere ?? null, tipo: tipo ?? null },
    { next: { revalidate: 60 } }
  )
}

export async function getMiniatura(slug: string): Promise<Miniatura | null> {
  return client.fetch(
    groq`*[_type == "miniatura" && slug.current == $slug][0] {
      _id,
      nome,
      slug,
      bestSeller,
      descrizione,
      immagini,
      file3d { asset->{ _ref, url } },
      scala,
      genere,
      tipo,
      videoFiles[] { asset->{ _ref, url, mimeType } },
      videoUrls,
      varianti[] { _key, nome, materiale, prezzo, prezzoScontato, scadenzaSconto, disponibilita, quantita }
    }`,
    { slug },
    { next: { revalidate: 60 } }
  )
}

export async function getBestSellers(): Promise<MiniatureListItem[]> {
  return client.fetch(
    groq`*[_type == "miniatura" && bestSeller == true] | order(_createdAt desc) { ${miniatureListFields} }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getMiniatureInOfferta(): Promise<MiniatureListItem[]> {
  return client.fetch(
    groq`*[_type == "miniatura" && count(varianti[defined(prezzoScontato) && (!defined(scadenzaSconto) || dateTime(scadenzaSconto) > dateTime(now()))]) > 0] | order(_createdAt desc) { ${miniatureListFields} }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getCreators(): Promise<Creator[]> {
  return client.fetch(
    groq`*[_type == "creator"] | order(_createdAt asc) {
      _id, nome, piattaforma, url, avatar, descrizione
    }`,
    {},
    { next: { revalidate: 300 } }
  )
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(
    groq`*[_type == "siteSettings" && _id == "siteSettings"][0] {
      percentualeNegozio,
      heroSlides[] { _key, immagine, videoUrl, titolo, sottotitolo }
    }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export interface OrdineRow {
  _id: string
  cliente: { nome: string; telefono?: string }
  miniaturaNome?: string
  miniaturaSlug?: string
  varianteNome?: string
  prezzo?: number
  venditaTramiteNegozio?: boolean
  negozioId?: string
  negozioNome?: string
  clientePagato?: boolean
  importoRicevuto?: number
  stato: 'ricevuto' | 'in_lavorazione' | 'pronto' | 'consegnato'
  dataOrdine?: string
  note?: string
}

export async function getAllOrdini(): Promise<OrdineRow[]> {
  // Dashboard: leggere sempre dati freschi (no CDN, no cache) per riflettere subito i pagamenti
  return client.withConfig({ useCdn: false }).fetch(
    groq`*[_type == "ordine"] | order(dataOrdine desc) {
      _id,
      cliente,
      "miniaturaNome": miniatura->nome,
      "miniaturaSlug": miniatura->slug.current,
      varianteNome,
      prezzo,
      venditaTramiteNegozio,
      "negozioId": negozio->_id,
      "negozioNome": negozio->nome,
      clientePagato,
      importoRicevuto,
      stato,
      dataOrdine,
      note
    }`,
    {},
    { cache: 'no-store' }
  )
}

/** Negozio (senza giacenze: la giacenza attuale si calcola dai movimenti, vedi getMovimentiPerNegozio). Non seleziona mai passwordHash. */
export async function getNegozioBySlug(slug: string): Promise<Negozio | null> {
  return client.withConfig({ useCdn: false }).fetch(
    groq`*[_type == "negozio" && slug.current == $slug][0] {
      _id, nome, slug, indirizzo, percentualeNegozio, attivo
    }`,
    { slug },
    { cache: 'no-store' }
  )
}

export async function getAllNegozi(): Promise<Negozio[]> {
  return client.withConfig({ useCdn: false }).fetch(
    groq`*[_type == "negozio"] | order(nome asc) {
      _id, nome, slug, indirizzo, percentualeNegozio, attivo
    }`,
    {},
    { cache: 'no-store' }
  )
}

/** Movimenti di giacenza di un negozio (consegne/ritiri/vendite), più recenti prima. */
export async function getMovimentiPerNegozio(negozioId: string): Promise<MovimentoGiacenza[]> {
  return client.withConfig({ useCdn: false }).fetch(
    groq`*[_type == "movimentoGiacenza" && negozio._ref == $negozioId] | order(data desc) {
      _id, "miniatura": miniatura->{ ${miniaturaRefFields} }, varianteNome, quantita, motivo, data, note
    }`,
    { negozioId },
    { cache: 'no-store' }
  )
}

export async function getVenditeSegnalate(soloDaRevisionare = false): Promise<VenditaSegnalata[]> {
  const filter = soloDaRevisionare
    ? '*[_type == "venditaSegnalata" && stato == "segnalata"]'
    : '*[_type == "venditaSegnalata"]'
  return client.withConfig({ useCdn: false }).fetch(
    groq`${filter} | order(data desc) {
      _id,
      "negozio": negozio->{ _id, nome },
      "miniatura": miniatura->{ ${miniaturaRefFields} },
      varianteNome,
      quantita,
      prezzoListino,
      prezzoStimato,
      offertaUsata,
      scontoExtra,
      data,
      note,
      stato,
      ordineCollegato
    }`,
    {},
    { cache: 'no-store' }
  )
}

export interface OrdineNegozioRow {
  _id: string
  prezzo?: number
  clientePagato?: boolean
  importoRicevuto?: number
}

/** Ordini ufficiali collegati a un negozio, per calcolare il credito che ti deve. */
export async function getOrdiniPerNegozio(negozioId: string): Promise<OrdineNegozioRow[]> {
  return client.withConfig({ useCdn: false }).fetch(
    groq`*[_type == "ordine" && negozio._ref == $negozioId] {
      _id, prezzo, clientePagato, importoRicevuto
    }`,
    { negozioId },
    { cache: 'no-store' }
  )
}

export async function getVenditeSegnalatePerNegozio(negozioId: string): Promise<VenditaSegnalata[]> {
  return client.withConfig({ useCdn: false }).fetch(
    groq`*[_type == "venditaSegnalata" && negozio._ref == $negozioId] | order(data desc) {
      _id,
      "miniatura": miniatura->{ ${miniaturaRefFields} },
      varianteNome,
      quantita,
      prezzoListino,
      prezzoStimato,
      offertaUsata,
      scontoExtra,
      data,
      note,
      stato
    }`,
    { negozioId },
    { cache: 'no-store' }
  )
}

export async function getRelated(
  slug: string,
  genere?: string | null,
  tipo?: string | null
): Promise<MiniatureListItem[]> {
  const conditions = ['_type == "miniatura"', 'slug.current != $slug']
  if (genere) conditions.push('genere == $genere')
  else if (tipo) conditions.push('tipo == $tipo')

  return client.fetch(
    groq`*[${conditions.join(' && ')}] | order(_createdAt desc)[0..2] { ${miniatureListFields} }`,
    { slug, genere: genere ?? null, tipo: tipo ?? null },
    { next: { revalidate: 60 } }
  )
}

const profiloFields = groq`
  _id, nome, materiale, visibileAlPubblico,
  densita, costoFilamentoKg, velocitaStampaGh, wattaggioW, costoKwh,
  costoOraLavoro, markupPct, prezzoMinimo,
  finiture[]->{ _id, nome, oreLavoro }
`

export async function getProfiliPrezzo(soloVisibili = false): Promise<ProfiloPrezzo[]> {
  const filter = soloVisibili
    ? '*[_type == "profiloPrezzo" && visibileAlPubblico == true]'
    : '*[_type == "profiloPrezzo"]'
  return client.fetch(
    groq`${filter} | order(nome asc) { ${profiloFields} }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getAllFiniture(soloVisibili = false): Promise<Finitura[]> {
  const filter = soloVisibili
    ? '*[_type == "finitura" && visibileAlPubblico == true]'
    : '*[_type == "finitura"]'
  return client.fetch(
    groq`${filter} | order(ordine asc, nome asc) { _id, nome, oreLavoro }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getAllCosti(): Promise<Costo[]> {
  return client.withConfig({ useCdn: false }).fetch(
    groq`*[_type == "costo"] | order(data desc) { _id, descrizione, categoria, importo, data, note }`,
    {},
    { cache: 'no-store' }
  )
}

export async function getAllSlugs(): Promise<{ slug: { current: string } }[]> {
  return client.fetch(
    groq`*[_type == "miniatura"] { slug }`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export async function getGeneriETipi(): Promise<{ generi: string[]; tipi: string[] }> {
  const [generi, tipi] = await Promise.all([
    client.fetch<string[]>(
      groq`array::unique(*[_type == "miniatura" && defined(genere)].genere)`,
      {},
      { next: { revalidate: 300 } }
    ),
    client.fetch<string[]>(
      groq`array::unique(*[_type == "miniatura" && defined(tipo)].tipo)`,
      {},
      { next: { revalidate: 300 } }
    ),
  ])
  return { generi: generi ?? [], tipi: tipi ?? [] }
}
