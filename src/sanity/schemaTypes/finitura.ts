import { defineField, defineType } from 'sanity'

export const finitura = defineType({
  name: 'finitura',
  title: 'Finitura',
  type: 'document',
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome',
      type: 'string',
      description: 'Es. Grezzo, Con primer, Pittura tabletop, Pittura dettagliata',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'oreLavoro',
      title: 'Ore di lavoro',
      type: 'number',
      description: 'Ore medie di lavoro manuale per questa finitura',
      validation: (Rule) => Rule.required().min(0),
      initialValue: 1,
    }),
    defineField({
      name: 'ordine',
      title: 'Ordine di visualizzazione',
      type: 'number',
      description: 'Numero più basso = mostrato prima',
      initialValue: 0,
    }),
    defineField({
      name: 'visibileAlPubblico',
      title: 'Visibile nel calcolatore pubblico',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [
    { title: 'Ordine', by: [{ field: 'ordine', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'nome', ore: 'oreLavoro', visibile: 'visibileAlPubblico' },
    prepare({ title, ore, visibile }) {
      return {
        title,
        subtitle: `${ore}h lavoro${visibile === false ? ' · solo admin' : ''}`,
      }
    },
  },
})
