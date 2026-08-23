import type { MetadataRoute } from 'next'
import { getAllSlugs } from '@/sanity/lib/queries'
import { SITE_URL as BASE_URL } from '@/lib/siteUrl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/calcolatore`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/come-funziona`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/personalizzazioni`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const miniaturePages: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${BASE_URL}/miniature/${s.slug.current}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...miniaturePages]
}
