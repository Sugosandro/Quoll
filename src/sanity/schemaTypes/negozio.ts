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
      title: 'Slug (link del portale e della pagina pubblica)',
      type: 'slug',
      description:
        'Determina sia il link privato del portale (sito.it/negozio/questo-slug) sia, se reso pubblico, quello della pagina vetrina (sito.it/negozi/questo-slug)',
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
      title: 'Accesso al portale attivo',
      type: 'boolean',
      initialValue: true,
      description: 'Disattiva per bloccare il login del negozio senza cancellarlo',
    }),
    defineField({
      name: 'visibilePubblicamente',
      title: 'Visibile sul sito pubblico',
      type: 'boolean',
      initialValue: false,
      description:
        'Attiva per far comparire questo negozio in home e su /negozi, con la sua pagina vetrina pubblica. Indipendente dall\'accesso al portale: puoi attivare il portale prima di renderlo pubblico (es. durante l\'avvio).',
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
    select: { title: 'nome', subtitle: 'indirizzo', attivo: 'attivo', pubblico: 'visibilePubblicamente', media: 'immagine' },
    prepare({ title, subtitle, attivo, pubblico, media }) {
      const badge = `${attivo === false ? '🔒 ' : ''}${pubblico ? '🌐 ' : ''}`
      return { title: `${badge}${title ?? 'Negozio'}`, subtitle, media }
    },
  },
})
