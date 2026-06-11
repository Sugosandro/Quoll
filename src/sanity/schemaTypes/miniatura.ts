import { defineField, defineType } from 'sanity'

export const miniatura = defineType({
  name: 'miniatura',
  title: 'Miniatura',
  type: 'document',
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'nome', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bestSeller',
      title: 'Best Seller ⭐',
      type: 'boolean',
      initialValue: false,
      description: 'Mostra nella sezione "Più venduti" in homepage',
    }),
    defineField({
      name: 'descrizione',
      title: 'Descrizione',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'immagini',
      title: 'Immagini',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'file3d',
      title: 'File 3D (GLB/GLTF)',
      type: 'file',
      options: { accept: '.glb,.gltf' },
    }),
    defineField({
      name: 'scala',
      title: 'Scala',
      type: 'string',
      description: 'Es. 32mm, 54mm, 1:35',
    }),
    defineField({
      name: 'genere',
      title: 'Genere',
      type: 'string',
      description: 'Es. Fantasy, Sci-Fi, Horror, Storico, Moderno — scrivi liberamente',
    }),
    defineField({
      name: 'tipo',
      title: 'Tipo',
      type: 'string',
      description: 'Es. Personaggio, Veicolo, Edificio, Animale, Accessorio — scrivi liberamente',
    }),
    defineField({
      name: 'videoUrls',
      title: 'Video (YouTube / Vimeo)',
      type: 'array',
      of: [{ type: 'url' }],
      description: 'Incolla link YouTube o Vimeo — es. https://youtube.com/watch?v=...',
    }),
    defineField({
      name: 'varianti',
      title: 'Varianti',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'nome',
              title: 'Nome variante',
              type: 'string',
              description: 'Es. PLA grezzo, con primer, dipinta',
            }),
            defineField({
              name: 'materiale',
              title: 'Materiale',
              type: 'string',
              description: 'Es. PLA, Resina',
            }),
            defineField({
              name: 'prezzo',
              title: 'Prezzo (€)',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'prezzoScontato',
              title: 'Prezzo scontato (€)',
              type: 'number',
              description: 'Lascia vuoto se non in offerta',
              validation: (Rule) => Rule.min(0),
            }),
            defineField({
              name: 'scadenzaSconto',
              title: 'Scadenza sconto',
              type: 'datetime',
              description: 'Lascia vuoto se lo sconto non ha scadenza',
              options: { dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm' },
            }),
            defineField({
              name: 'disponibilita',
              title: 'Disponibilità',
              type: 'string',
              options: {
                list: [
                  { title: 'Disponibile', value: 'disponibile' },
                  { title: 'Ultimi pezzi', value: 'ultimi' },
                  { title: 'Esaurito', value: 'esaurito' },
                ],
                layout: 'radio',
              },
              initialValue: 'disponibile',
            }),
            defineField({
              name: 'quantita',
              title: 'Quantità rimasta',
              type: 'number',
              description: 'Quanti pezzi sono disponibili',
              hidden: ({ parent }) => parent?.disponibilita !== 'ultimi',
              validation: (Rule) => Rule.min(1).integer(),
            }),
          ],
          preview: {
            select: { title: 'nome', subtitle: 'prezzo', scontato: 'prezzoScontato', disp: 'disponibilita', qty: 'quantita' },
            prepare({ title, subtitle, scontato, disp, qty }) {
              const prezzoStr = scontato != null
                ? `€${scontato} (scontato da €${subtitle})`
                : subtitle != null ? `€${subtitle}` : ''
              const dispStr = disp === 'esaurito' ? ' · Esaurito' : disp === 'ultimi' ? ` · Ultimi ${qty ?? '?'} pz` : ''
              return { title, subtitle: prezzoStr + dispStr }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'nome', media: 'immagini.0' },
  },
})
