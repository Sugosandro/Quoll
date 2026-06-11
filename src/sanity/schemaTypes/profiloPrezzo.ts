import { defineField, defineType } from 'sanity'

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

    // — Stampa —
    defineField({
      name: 'velocitaStampaGh',
      title: 'Velocità di stampa (g/h)',
      type: 'number',
      initialValue: 2.5,
      description: 'Grammi di materiale stampati per ora. Miniature di qualità: 2–4 g/h',
      group: 'stampa',
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

    // — Lavoro manuale —
    defineField({
      name: 'costoOraLavoro',
      title: 'Costo orario lavoro (€/h)',
      type: 'number',
      initialValue: 14,
      description: 'Le ore per ogni finitura si gestiscono in Studio → Finiture',
      group: 'lavoro',
      validation: (R) => R.required().min(0),
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
      title: 'Markup (%)',
      type: 'number',
      initialValue: 40,
      description: 'Applicato sul totale dei costi',
      group: 'prezzo',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'prezzoMinimo',
      title: 'Prezzo minimo (€)',
      type: 'number',
      initialValue: 10,
      description: 'Soglia sotto la quale non si scende mai',
      group: 'prezzo',
      validation: (R) => R.required().min(0),
    }),
  ],
  preview: {
    select: { title: 'nome', mat: 'materiale', pub: 'visibileAlPubblico' },
    prepare({ title, mat, pub }) {
      return {
        title,
        subtitle: [mat, pub === false ? '(solo admin)' : null].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [{ title: 'Alfabetico', name: 'nomeAsc', by: [{ field: 'nome', direction: 'asc' }] }],
})
