import { defineField, defineType } from 'sanity'
import { VarianteInput } from '../components/VarianteInput'

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
      description: 'Scegli tra le varianti della miniatura selezionata, oppure "Personalizzata" per una richiesta fuori catalogo.',
      components: { input: VarianteInput },
    }),
    defineField({
      name: 'quantita',
      title: 'Quantità',
      type: 'number',
      initialValue: 1,
      description: 'Numero di pezzi in questo ordine, se più di uno',
      validation: (R) => R.min(1).integer(),
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
      description: 'Attiva se l\'ordine è stato venduto tramite un negozio convenzionato',
      initialValue: false,
    }),
    defineField({
      name: 'negozio',
      title: 'Negozio',
      type: 'reference',
      to: [{ type: 'negozio' }],
      description: 'A quale negozio è collegata questa vendita',
      hidden: ({ parent }) => !parent?.venditaTramiteNegozio,
    }),
    defineField({
      name: 'clientePagato',
      title: '💵 Cliente ha pagato',
      type: 'boolean',
      description: 'Vendita tramite negozio: il cliente ha pagato il negozio. Vendita diretta: il cliente ha pagato te.',
      initialValue: false,
    }),
    defineField({
      name: 'importoRicevuto',
      title: '💰 Importo già ricevuto (€)',
      type: 'number',
      description: 'Quanto hai effettivamente incassato finora per questo ordine. Aggiornalo se il pagamento arriva spezzettato. Quando raggiunge la tua quota, l\'ordine è saldato.',
      validation: (R) => R.min(0),
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
      quantita: 'quantita',
      // Nessuna immagine propria sull'ordine: prende in automatico la prima
      // foto della miniatura collegata, seguendo il riferimento.
      media: 'miniatura.immagini.0',
    },
    prepare({ nome, miniatura, stato, prezzo, quantita, media }) {
      const icone: Record<string, string> = {
        ricevuto: '📥', in_lavorazione: '⚙️', pronto: '✅', consegnato: '📦',
      }
      const miniaturaLabel = quantita > 1 ? `${miniatura} ×${quantita}` : miniatura
      return {
        title: `${icone[stato] ?? ''} ${nome ?? 'Cliente sconosciuto'}`,
        subtitle: [miniaturaLabel, prezzo != null ? `€${prezzo}` : null].filter(Boolean).join(' · '),
        media,
      }
    },
  },
  orderings: [
    { title: 'Più recenti', name: 'dataDesc', by: [{ field: 'dataOrdine', direction: 'desc' }] },
  ],
})
