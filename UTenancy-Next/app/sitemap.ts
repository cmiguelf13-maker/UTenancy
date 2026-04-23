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

  // Static mock listings — content doesn't change, use a fixed date
  const MOCK_LISTINGS_DATE = new Date('2025-01-15')
  const mockListingUrls: MetadataRoute.Sitemap = LISTINGS.map((l) => ({
    url: `https://utenancy.com/listings/${l.slug}`,
    lastModified: MOCK_LISTINGS_DATE,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Real publish dates for each blog post — prevents false "freshness" signals
  const blogPosts: Array<{ slug: string; date: Date }> = [
    { slug: 'how-to-find-off-campus-housing-los-angeles', date: new Date('2025-03-12') },
    { slug: 'lease-terms-every-student-should-understand', date: new Date('2025-02-28') },
    { slug: 'how-to-attract-student-tenants-landlord-guide', date: new Date('2025-02-10') },
    { slug: 'renting-with-roommates-complete-guide', date: new Date('2025-01-22') },
    { slug: 'best-neighborhoods-students-los-angeles', date: new Date('2025-01-08') },
  ]

  return [
    {
      url: 'https://utenancy.com',
      lastModified: new Date(), // Homepage changes daily (listings)
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://utenancy.com/housing/lmu',
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://utenancy.com/listings',
      lastModified: new Date(), // Listings index changes daily
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://utenancy.com/blog',
      lastModified: new Date('2025-03-12'), // Date of latest post
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...blogPosts.map(({ slug, date }) => ({
      url: `https://utenancy.com/blog/${slug}`,
      lastModified: date,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: 'https://utenancy.com/about',
      lastModified: new Date('2025-01-15'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...dbListingUrls,
    ...mockListingUrls,
  ]
}
