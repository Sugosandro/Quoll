import { defineField, defineType } from 'sanity'

export const ordine = defineType({
  name: 'ordine',
  title: 'Ordine',
  type: 'document',
  fields: [
    defineField({
      name: 'cliente',
      title: 'Cliente',
      type: 'object',
      fields: [
        defineField({ name: 'nome', title: 'Nome', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'telefono', title: 'Telefono / WhatsApp', type: 'string' }),
      ],
    }),
    defineField({
      name: 'miniatura',
      title: 'Miniatura',
      type: 'reference',
      to: [{ type: 'miniatura' }],
    }),
    defineField({
      name: 'varianteNome',
      title: 'Variante ordinata',
      type: 'string',
      description: 'Es. PLA grezzo, dipinta…',
    }),
    defineField({
      name: 'prezzo',
      title: 'Prezzo concordato (€)',
      type: 'number',
    }),
    defineField({
      name: 'stato',
      title: 'Stato',
      type: 'string',
      options: {
        list: [
          { title: '📥 Ricevuto', value: 'ricevuto' },
          { title: '⚙️ In lavorazione', value: 'in_lavorazione' },
          { title: '✅ Pronto', value: 'pronto' },
          { title: '📦 Consegnato', value: 'consegnato' },
        ],
        layout: 'radio',
      },
      initialValue: 'ricevuto',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'dataOrdine',
      title: 'Data ordine',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'venditaTramiteNegozio',
      title: 'Venduto tramite negozio',
      type: 'boolean',
      description: 'Attiva se l\'ordine è stato venduto tramite il negozio convenzionato',
      initialValue: false,
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      nome: 'cliente.nome',
      miniatura: 'miniatura.nome',
      stato: 'stato',
      prezzo: 'prezzo',
    },
    prepare({ nome, miniatura, stato, prezzo }) {
      const icone: Record<string, string> = {
        ricevuto: '📥', in_lavorazione: '⚙️', pronto: '✅', consegnato: '📦',
      }
      return {
        title: `${icone[stato] ?? ''} ${nome ?? 'Cliente sconosciuto'}`,
        subtitle: [miniatura, prezzo != null ? `€${prezzo}` : null].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    { title: 'Più recenti', name: 'dataDesc', by: [{ field: 'dataOrdine', direction: 'desc' }] },
  ],
})
