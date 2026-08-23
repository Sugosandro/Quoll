import { defineField, defineType } from 'sanity'
import { PasswordHashInput } from '../components/PasswordHashInput'

export const negozio = defineType({
  name: 'negozio',
  title: 'Negozio',
  type: 'document',
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (link del portale)',
      type: 'slug',
      description: 'Determina il link del portale: sito.it/negozio/questo-slug',
      options: { source: 'nome', maxLength: 96 },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'passwordHash',
      title: 'Password di accesso',
      type: 'string',
      description:
        'Scrivi qui una password in chiaro: viene salvata cifrata automaticamente e non è più leggibile dopo il salvataggio.',
      components: { input: PasswordHashInput },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'indirizzo',
      title: 'Indirizzo',
      type: 'string',
    }),
    defineField({
      name: 'percentualeNegozio',
      title: 'Percentuale negozio (%) — override',
      type: 'number',
      description: 'Lascia vuoto per usare la percentuale globale impostata in "Impostazioni sito"',
      validation: (R) => R.min(0).max(100),
    }),
    defineField({
      name: 'attivo',
      title: 'Accesso attivo',
      type: 'boolean',
      initialValue: true,
      description: 'Disattiva per bloccare il login del negozio senza cancellarlo',
    }),
    defineField({
      name: 'immagine',
      title: 'Immagine',
      type: 'image',
      options: { hotspot: true },
      description: 'Foto del negozio, opzionale',
    }),
  ],
  preview: {
    select: { title: 'nome', subtitle: 'indirizzo', attivo: 'attivo', media: 'immagine' },
    prepare({ title, subtitle, attivo, media }) {
      return { title: `${attivo === false ? '🔒 ' : ''}${title ?? 'Negozio'}`, subtitle, media }
    },
  },
})
