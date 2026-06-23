import { groq } from 'next-sanity'
import { client } from './client'
import type { Miniatura, MiniatureListItem, Creator, SiteSettings, Costo, ProfiloPrezzo, Finitura } from '@/types/miniatura'

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
