import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Impostazioni sito',
  type: 'document',
  fields: [
    defineField({
      name: 'percentualeNegozio',
      title: 'Percentuale negozio (%)',
      type: 'number',
      description: 'Quota che va al negozio convenzionato sulle vendite tramite negozio',
      initialValue: 30,
      validation: (R) => R.min(0).max(100),
    }),
    defineField({
      name: 'heroSlides',
      title: 'Slide Hero',
      type: 'array',
      description: 'Immagini o video che scorrono nella homepage. Se vuoto viene usato lo sfondo scuro di default.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'immagine',
              title: 'Immagine di sfondo',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'videoUrl',
              title: 'URL Video (YouTube / Vimeo)',
              type: 'url',
              description: 'Opzionale — se presente viene usato al posto dell\'immagine',
            }),
            defineField({
              name: 'titolo',
              title: 'Titolo (opzionale)',
              type: 'string',
              description: 'Sovrascrive il titolo di default',
            }),
            defineField({
              name: 'sottotitolo',
              title: 'Sottotitolo (opzionale)',
              type: 'string',
            }),
          ],
          preview: {
            select: { title: 'titolo', media: 'immagine' },
            prepare({ title, media }) {
              return { title: title || 'Slide senza titolo', media }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Impostazioni sito' }
    },
  },
})
