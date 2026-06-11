import { defineField, defineType } from 'sanity'

export const costo = defineType({
  name: 'costo',
  title: 'Costo',
  type: 'document',
  fields: [
    defineField({
      name: 'descrizione',
      title: 'Descrizione',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'categoria',
      title: 'Categoria',
      type: 'string',
      options: {
        list: [
          { title: 'Materiale (filamento, resina…)', value: 'materiale' },
          { title: 'Attrezzatura', value: 'attrezzatura' },
          { title: 'Negozio / Marketplace', value: 'negozio' },
          { title: 'Altro', value: 'altro' },
        ],
        layout: 'radio',
      },
      initialValue: 'materiale',
    }),
    defineField({
      name: 'importo',
      title: 'Importo (€)',
      type: 'number',
      validation: (R) => R.required().min(0),
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
    select: { title: 'descrizione', subtitle: 'importo', cat: 'categoria' },
    prepare({ title, subtitle, cat }) {
      const icons: Record<string, string> = {
        materiale: '🧱', attrezzatura: '🔧', negozio: '🏪', altro: '📌',
      }
      return {
        title: `${icons[cat] ?? '📌'} ${title}`,
        subtitle: subtitle != null ? `€${subtitle}` : '',
      }
    },
  },
  orderings: [
    { title: 'Più recenti', name: 'dataDesc', by: [{ field: 'data', direction: 'desc' }] },
  ],
})
