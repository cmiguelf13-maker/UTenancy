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

  const blogSlugs = [
    'how-to-find-off-campus-housing-los-angeles',
    'lease-terms-every-student-should-understand',
    'how-to-attract-student-tenants-landlord-guide',
    'renting-with-roommates-complete-guide',
    'best-neighborhoods-students-los-angeles',
  ]

  return [
    {
      url: 'https://utenancy.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://utenancy.com/housing/lmu',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://utenancy.com/listings',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://utenancy.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...blogSlugs.map((slug) => ({
      url: `https://utenancy.com/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: 'https://utenancy.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...dbListingUrls,
    ...mockListingUrls,
  ]
}
