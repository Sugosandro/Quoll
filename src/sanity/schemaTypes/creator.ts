import { defineField, defineType } from 'sanity'

export const creator = defineType({
  name: 'creator',
  title: 'Creator',
  type: 'document',
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'piattaforma',
      title: 'Piattaforma',
      type: 'string',
      options: {
        list: [
          { title: 'MyMiniFactory', value: 'myminifactory' },
          { title: 'Patreon', value: 'patreon' },
          { title: 'Kickstarter', value: 'kickstarter' },
          { title: 'Altro', value: 'altro' },
        ],
      },
    }),
    defineField({
      name: 'url',
      title: 'Link al profilo',
      type: 'url',
      description: 'Es. link alla pagina MyMiniFactory o Patreon',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar / Logo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'descrizione',
      title: 'Descrizione breve',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: { title: 'nome', subtitle: 'piattaforma', media: 'avatar' },
  },
})
