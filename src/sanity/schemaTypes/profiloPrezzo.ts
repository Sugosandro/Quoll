import { defineField, defineType } from 'sanity'

const isResina = ({ document }: { document?: Record<string, unknown> }) => document?.tecnologia === 'resina'

export const profiloPrezzo = defineType({
  name: 'profiloPrezzo',
  title: 'Profilo di prezzo',
  type: 'document',
  groups: [
    { name: 'materiale', title: 'Materiale' },
    { name: 'stampa',    title: 'Stampa' },
    { name: 'lavoro',    title: 'Lavoro manuale' },
    { name: 'prezzo',    title: 'Prezzo finale' },
  ],
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome profilo',
      type: 'string',
      description: 'Es. "PLA Standard", "Resina Premium", "PETG Tecnico"',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'tecnologia',
      title: 'Tecnologia',
      type: 'string',
      options: {
        list: [
          { title: 'FFF / Filamento', value: 'fff' },
          { title: 'Resina (MSLA)', value: 'resina' },
        ],
        layout: 'radio',
      },
      initialValue: 'fff',
      description: 'Nel calcolatore il profilo compare solo quando è selezionata questa tecnologia',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'visibileAlPubblico',
      title: 'Visibile nel calcolatore pubblico',
      type: 'boolean',
      initialValue: true,
      description: 'Se disattivato è visibile solo nel calcolatore admin',
    }),

    // — Materiale —
    defineField({
      name: 'materiale',
      title: 'Tipo di materiale',
      type: 'string',
      description: 'Solo descrittivo (es. PLA, PETG, Resina)',
      group: 'materiale',
    }),
    defineField({
      name: 'immagine',
      title: 'Immagine',
      type: 'image',
      options: { hotspot: true },
      description: 'Foto di riferimento del materiale/campione, opzionale',
      group: 'materiale',
    }),
    defineField({
      name: 'densita',
      title: 'Densità (g/cm³)',
      type: 'number',
      initialValue: 1.24,
      description: 'PLA ≈ 1.24 · PETG ≈ 1.27 · Resina ≈ 1.10 · ABS ≈ 1.04',
      group: 'materiale',
      validation: (R) => R.required().min(0.5).max(3),
    }),
    defineField({
      name: 'costoFilamentoKg',
      title: 'Costo filamento / resina (€/kg)',
      type: 'number',
      initialValue: 22,
      group: 'materiale',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'fattoreRiempimento',
      title: 'Fattore di riempimento',
      type: 'number',
      initialValue: 0.7,
      description: 'Quota di volume effettivamente piena (pareti + infill). Le miniature sono quasi solo pareti: ≈ 0.7',
      group: 'materiale',
      hidden: isResina,
      validation: (R) => R.min(0.1).max(1),
    }),

    // — Stampa —
    defineField({
      name: 'altezzaLayerMm',
      title: 'Altezza layer (mm)',
      type: 'number',
      description: 'FFF miniature ≈ 0.1 · Resina ≈ 0.05',
      group: 'stampa',
      validation: (R) => R.min(0.01).max(1),
    }),
    defineField({
      name: 'secondiPerLayer',
      title: 'Secondi per layer',
      type: 'number',
      description: 'FFF: tempo minimo per layer (raffreddamento, spostamenti) ≈ 10 · Resina: esposizione + sollevamento ≈ 6.5',
      group: 'stampa',
      validation: (R) => R.min(0.5),
    }),
    defineField({
      name: 'minutiAvvio',
      title: 'Minuti di avvio',
      type: 'number',
      initialValue: 10,
      description: 'Tempo fisso per stampa: riscaldamento e primo layer (FFF), layer di base e raft (resina)',
      group: 'stampa',
      validation: (R) => R.min(0),
    }),
    defineField({
      name: 'velocitaStampaGh',
      title: 'Portata di stampa (g/h)',
      type: 'number',
      initialValue: 15,
      description: 'Solo FFF: grammi estrusi per ora, si somma al tempo dei layer',
      group: 'stampa',
      hidden: isResina,
      validation: (R) => R.required().min(0.1),
    }),
    defineField({
      name: 'wattaggioW',
      title: 'Wattaggio stampante (W)',
      type: 'number',
      initialValue: 150,
      group: 'stampa',
      validation: (R) => R.required().min(1),
    }),
    defineField({
      name: 'costoKwh',
      title: 'Costo energia (€/kWh)',
      type: 'number',
      initialValue: 0.25,
      group: 'stampa',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'costoOraMacchina',
      title: 'Usura macchina (€/h)',
      type: 'number',
      initialValue: 0.3,
      description: 'Ammortamento, manutenzione e stampe fallite per ora di stampa (elettricità esclusa)',
      group: 'stampa',
      validation: (R) => R.min(0),
    }),

    // — Lavoro manuale —
    defineField({
      name: 'costoOraLavoro',
      title: 'Costo orario lavoro (€/h)',
      type: 'number',
      initialValue: 14,
      description: 'Le ore per ogni finitura si gestiscono in Studio → Finiture (riferite a una mini standard da 28–32 mm)',
      group: 'lavoro',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'esponenteCurvaLavoro',
      title: 'Curva ore di lavoro',
      type: 'number',
      initialValue: 0.75,
      description:
        'La prima ora si paga piena, le successive sempre meno. 1 = lineare · 0.75 = 7 h vengono pagate come 4.3 h · più basso = più sconto sulle lavorazioni lunghe',
      group: 'lavoro',
      validation: (R) => R.min(0.3).max(1),
    }),
    defineField({
      name: 'superficieRiferimentoCm2',
      title: 'Superficie di riferimento (cm²)',
      type: 'number',
      initialValue: 32,
      description:
        'Superficie della mini standard a cui si riferiscono le ore delle finiture (una 28–32 mm ≈ 30–33 cm²). Modelli più grandi o in scala maggiore richiedono proporzionalmente più ore',
      group: 'lavoro',
      validation: (R) => R.min(1),
    }),

    // — Finiture associate —
    defineField({
      name: 'finiture',
      title: 'Finiture disponibili',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'finitura' }] }],
      description: 'Scegli quali finiture sono applicabili a questo profilo (es. non tutte le finiture hanno senso per tutti i materiali)',
      group: 'lavoro',
    }),

    // — Prezzo finale —
    defineField({
      name: 'markupPct',
      title: 'Markup stampa (%)',
      type: 'number',
      initialValue: 25,
      description: 'Applicato solo alla parte stampa (materiale, elettricità, usura), non al lavoro manuale',
      group: 'prezzo',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'prezzoMinimo',
      title: 'Prezzo minimo stampa (€)',
      type: 'number',
      initialValue: 3,
      description: 'Minimo per la sola parte stampa, prima della commissione negozio (il lavoro manuale si aggiunge sopra)',
      group: 'prezzo',
      validation: (R) => R.required().min(0),
    }),
  ],
  preview: {
    select: { title: 'nome', mat: 'materiale', tec: 'tecnologia', pub: 'visibileAlPubblico', media: 'immagine' },
    prepare({ title, mat, tec, pub, media }) {
      return {
        title,
        subtitle: [tec === 'resina' ? 'Resina' : tec === 'fff' ? 'FFF' : null, mat, pub === false ? '(solo admin)' : null]
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
  },
  orderings: [{ title: 'Alfabetico', name: 'nomeAsc', by: [{ field: 'nome', direction: 'asc' }] }],
})
