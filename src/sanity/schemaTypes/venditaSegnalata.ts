import { defineField, defineType } from 'sanity'

export const venditaSegnalata = defineType({
  name: 'venditaSegnalata',
  title: 'Vendita segnalata (negozio)',
  type: 'document',
  description:
    'Creata dal negozio dal proprio portale — solo informativa. Non genera un ordine ufficiale finché non la converti da /admin/negozi.',
  fields: [
    defineField({
      name: 'negozio',
      title: 'Negozio',
      type: 'reference',
      to: [{ type: 'negozio' }],
      validation: (R) => R.required(),
      readOnly: true,
    }),
    defineField({
      name: 'miniatura',
      title: 'Miniatura',
      type: 'reference',
      to: [{ type: 'miniatura' }],
      validation: (R) => R.required(),
      readOnly: true,
    }),
    defineField({
      name: 'varianteNome',
      title: 'Variante',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'quantita',
      title: 'Quantità',
      type: 'number',
      initialValue: 1,
      validation: (R) => R.required().min(1).integer(),
      readOnly: true,
    }),
    defineField({
      name: 'prezzoListino',
      title: 'Prezzo di listino al momento della segnalazione (€)',
      type: 'number',
      description: 'Prezzo pieno della variante quando è stata segnalata la vendita — registrato in automatico, per confronto.',
      readOnly: true,
    }),
    defineField({
      name: 'prezzoStimato',
      title: 'Prezzo indicato dal negozio (€)',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'offertaUsata',
      title: 'Offerta attiva sul sito usata',
      type: 'boolean',
      description: 'Il negozio ha dichiarato di aver applicato lo sconto già attivo sul sito per questa variante',
      readOnly: true,
    }),
    defineField({
      name: 'scontoExtra',
      title: 'Sconto extra applicato dal negozio (€)',
      type: 'number',
      description: 'Sconto aggiuntivo fatto dal negozio, oltre al prezzo di listino/offerta',
      readOnly: true,
    }),
    defineField({
      name: 'data',
      title: 'Data segnalazione',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'note',
      title: 'Note del negozio',
      type: 'text',
      rows: 2,
      readOnly: true,
    }),
    defineField({
      name: 'stato',
      title: 'Stato',
      type: 'string',
      options: {
        list: [
          { title: '🆕 Da revisionare', value: 'segnalata' },
          { title: '✅ Confermata in ordine', value: 'confermata' },
        ],
        layout: 'radio',
      },
      initialValue: 'segnalata',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'ordineCollegato',
      title: 'Ordine ufficiale collegato',
      type: 'reference',
      to: [{ type: 'ordine' }],
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      negozio: 'negozio.nome',
      mini: 'miniatura.nome',
      qty: 'quantita',
      stato: 'stato',
      media: 'miniatura.immagini.0',
    },
    prepare({ negozio, mini, qty, stato, media }) {
      return {
        title: `${negozio ?? '?'} · ${mini ?? '?'} ×${qty ?? 1}`,
        subtitle: stato === 'confermata' ? '✅ Confermata' : '🆕 Da revisionare',
        media,
      }
    },
  },
  orderings: [{ title: 'Più recenti', name: 'dataDesc', by: [{ field: 'data', direction: 'desc' }] }],
})
