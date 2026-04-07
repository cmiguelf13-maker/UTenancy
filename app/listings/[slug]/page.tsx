// Server component — handles static params + data fetching
import { notFound } from 'next/navigation'
import { getListingBySlug, LISTINGS } from '@/lib/listings'
import { createServerClient } from '@/lib/supabase-server'
import ListingDetail from './ListingDetail'

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Try mock listing first
  const listing = getListingBySlug(slug)
  if (listing) {
    return {
      title: `${listing.title} — UTenancy Student Housing`,
      description: listing.description,
    }
  }

  // Try DB listing (slug might be a UUID)
  const supabase = createServerClient()
  const { data } = await supabase
    .from('listings')
    .select('address, city, description')
    .eq('id', slug)
    .single()

  if (data) {
    return {
      title: `${data.address}, ${data.city} — UTenancy Student Housing`,
      description: data.description,
    }
  }

  return {}
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Try mock listing first
  const mockListing = getListingBySlug(slug)
  if (mockListing) return <ListingDetail listing={mockListing} />

  // Try DB listing (slug is a UUID)
  const supabase = createServerClient()
  const { data: dbListing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', slug)
    .single()

  if (error) console.error('[listing page] fetch error:', error.message)

  if (!dbListing) notFound()

  // Map DB listing to the shape ListingDetail expects
  const listing = {
    id: dbListing.id,
    slug: dbListing.id,
    title: dbListing.address,
    location: `${dbListing.city}, ${dbListing.state}`,
    price: dbListing.rent,
    beds: dbListing.bedrooms,
    baths: dbListing.bathrooms,
    type: dbListing.type === 'open-room' ? 'open' : 'group',
    interested: 0,
    img: dbListing.images?.[0] ?? '',
    images: dbListing.images ?? [],
    description: dbListing.description ?? '',
    amenities: dbListing.amenities ?? [],
    distanceMi: undefined,
    university: undefined,
  } as any

  return <ListingDetail listing={listing} />
}
