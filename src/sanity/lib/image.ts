import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'
import { client } from './client'

const builder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export function getFileUrl(ref: string): string {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  // ref format: "file-{hash}-{extension}"
  const parts = ref.replace('file-', '').split('-')
  const extension = parts.pop()
  const hash = parts.join('-')
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${hash}.${extension}`
}
