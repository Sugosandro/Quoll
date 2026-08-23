import { defineField, defineType } from 'sanity'

export const movimentoGiacenza = defineType({
  name: 'movimentoGiacenza',
  title: 'Movimento giacenza negozio',
  type: 'document',
  description:
    'Registra ogni volta che porti pezzi in un negozio o li ritiri — la giacenza attuale è la somma di questi movimenti, così mantieni uno storico invece di un solo numero che si sovrascrive.',
  fields: [
    defineField({
      name: 'negozio',
      title: 'Negozio',
      type: 'reference',
      to: [{ type: 'negozio' }],
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'miniatura',
      title: 'Miniatura',
      type: 'reference',
      to: [{ type: 'miniatura' }],
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'varianteNome',
      title: 'Variante',
      type: 'string',
      description: 'Scrivi esattamente il nome della variante come su quella miniatura (es. "PLA grezzo")',
    }),
    defineField({
      name: 'quantita',
      title: 'Quantità',
      type: 'number',
      description: 'Positiva se porti pezzi in negozio (es. 5), negativa se li ritiri (es. -2)',
      validation: (R) =>
        R.required()
          .integer()
          .custom((val) => (val === 0 ? 'La quantità non può essere zero' : true)),
    }),
    defineField({
      name: 'motivo',
      title: 'Motivo',
      type: 'string',
      options: {
        list: [
          { title: '📦 Consegna', value: 'consegna' },
          { title: '↩️ Ritiro', value: 'ritiro' },
          { title: '✅ Vendita confermata', value: 'vendita_confermata' },
          { title: '🔧 Rettifica', value: 'rettifica' },
        ],
        layout: 'radio',
      },
      initialValue: 'consegna',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'data',
      title: 'Data',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      negozio: 'negozio.nome',
      mini: 'miniatura.nome',
      variante: 'varianteNome',
      qty: 'quantita',
      motivo: 'motivo',
      media: 'miniatura.immagini.0',
    },
    prepare({ negozio, mini, variante, qty, motivo, media }) {
      const segno = qty > 0 ? '+' : ''
      return {
        title: `${negozio ?? '?'} · ${mini ?? '?'}${variante ? ' — ' + variante : ''}`,
        subtitle: `${segno}${qty} · ${motivo ?? ''}`,
        media,
      }
    },
  },
  orderings: [{ title: 'Più recenti', name: 'dataDesc', by: [{ field: 'data', direction: 'desc' }] }],
})
