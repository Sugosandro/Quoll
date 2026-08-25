import type { MetadataRoute } from 'next'
import { getAllSlugs, getNegoziPubblici } from '@/sanity/lib/queries'
import { SITE_URL as BASE_URL } from '@/lib/siteUrl'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, negozi] = await Promise.all([getAllSlugs(), getNegoziPubblici()])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/negozi`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/calcolatore`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/come-funziona`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/personalizzazioni`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const miniaturePages: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${BASE_URL}/miniature/${s.slug.current}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const negozioPages: MetadataRoute.Sitemap = negozi.map((n) => ({
    url: `${BASE_URL}/negozi/${n.slug.current}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...staticPages, ...miniaturePages, ...negozioPages]
}
