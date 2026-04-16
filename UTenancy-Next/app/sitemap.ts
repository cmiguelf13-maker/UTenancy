import { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase-server'
import { LISTINGS } from '@/lib/listings'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient()

  const { data: dbListings } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'active')

  const dbListingUrls: MetadataRoute.Sitemap = (dbListings ?? []).map((l) => ({
    url: `https://utenancy.com/listings/${l.id}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const mockListingUrls: MetadataRoute.Sitemap = LISTINGS.map((l) => ({
    url: `https://utenancy.com/listings/${l.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: 'https://utenancy.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://utenancy.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://utenancy.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...dbListingUrls,
    ...mockListingUrls,
  ]
}
