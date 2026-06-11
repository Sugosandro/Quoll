import XLSX from 'xlsx'
import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'

// Carica le variabili d'ambiente da .env.local
const env = dotenv.parse(readFileSync('.env.local', 'utf8'))

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: env.SANITY_API_TOKEN,
  useCdn: false,
})

// Legge il foglio "Catalogo"
const wb = XLSX.readFile('./_import/Gestionale Stampe.xlsx')
const ws = wb.Sheets['Catalogo']
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

// Salta la riga di intestazione e raggruppa le varianti per nome prodotto
const prodotti = {}
for (const row of rows.slice(1)) {
  const [nome, variante, prezzo, disponibilita] = row
  if (!nome || !variante || prezzo === '') continue

  const nomeStr = String(nome).trim()
  if (!prodotti[nomeStr]) prodotti[nomeStr] = []

  prodotti[nomeStr].push({
    _key: Math.random().toString(36).slice(2),
    nome: String(variante).trim(),
    materiale: String(variante).trim(), // Resina / Dipinta
    prezzo: Number(prezzo),
    disponibile: Number(disponibilita) > 0,
  })
}

// Genera uno slug da una stringa
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // rimuove accenti
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Controlla quanti prodotti ci sono
const nomi = Object.keys(prodotti)
console.log(`Trovati ${nomi.length} prodotti:`)
nomi.forEach(n => console.log(` - ${n} (${prodotti[n].length} varianti)`))

// Verifica token prima di procedere
if (!env.SANITY_API_TOKEN) {
  console.error('\n❌ Manca SANITY_API_TOKEN nel file .env.local')
  console.error('Aggiungilo e riprova. Vedi istruzioni sotto.')
  process.exit(1)
}

console.log('\nImportazione in corso...')
let importati = 0
let saltati = 0

for (const [nome, varianti] of Object.entries(prodotti)) {
  const slug = slugify(nome)

  // Controlla se esiste già un documento con questo slug
  const esistente = await client.fetch(
    `*[_type == "miniatura" && slug.current == $slug][0]._id`,
    { slug }
  )

  if (esistente) {
    console.log(` ⏭  Saltato (già esiste): ${nome}`)
    saltati++
    continue
  }

  await client.create({
    _type: 'miniatura',
    nome,
    slug: { _type: 'slug', current: slug },
    varianti,
  })

  console.log(` ✅ Importato: ${nome}`)
  importati++
}

console.log(`\nFatto! ${importati} prodotti importati, ${saltati} già esistenti saltati.`)
console.log('Apri Sanity Studio per aggiungere immagini, genere e tipo a ciascun prodotto.')
