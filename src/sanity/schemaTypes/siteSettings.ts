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
              name: 'videoFile',
              title: 'Video (caricato)',
              type: 'file',
              options: { accept: 'video/*' },
              description:
                'Consigliato: carica qui il video (mp4, H.264) per servirlo direttamente dal sito, senza loghi/UI di YouTube. Se presente ha priorità sul link esterno qui sotto.',
            }),
            defineField({
              name: 'videoUrl',
              title: 'URL Video (YouTube / Vimeo) — legacy',
              type: 'url',
              description: 'Solo se preferisci un link esterno invece di caricare il file. Usato al posto dell\'immagine se non c\'è un video caricato.',
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
