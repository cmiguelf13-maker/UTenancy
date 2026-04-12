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

  // ── Mock listing ──────────────────────────────────────────────
  const mockListing = getListingBySlug(slug)
  if (mockListing) {
    // Build similar listings from remaining mocks
    const similarMock = LISTINGS
      .filter((l) => l.slug !== slug)
      .slice(0, 3)
      .map((l) => ({
        id: String(l.id),
        address: l.title,
        city: l.location.split(',')[0].trim(),
        state: 'CA',
        rent: l.price,
        bedrooms: l.beds,
        bathrooms: l.baths ?? 1,
        type: l.type === 'open' ? 'open-room' : 'group-formation',
        img: l.img,
        slug: l.slug,
      }))
    return <ListingDetail listing={mockListing} similarListings={similarMock} />
  }

  // ── DB listing ────────────────────────────────────────────────
  const supabase = createServerClient()

  const { data: dbListing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', slug)
    .single()

  if (error) console.error('[listing page] fetch error:', error.message)
  if (!dbListing) notFound()

  // Fetch landlord profile and similar listings in parallel
  const [{ data: landlordProfile }, { data: similarRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, company, bio, phone')
      .eq('id', dbListing.landlord_id)
      .single(),
    supabase
      .from('listings')
      .select('id, address, city, state, rent, bedrooms, bathrooms, type, images')
      .eq('status', 'active')
      .neq('id', dbListing.id)
      .limit(3),
  ])

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
    // Lease detail fields
    available_date: dbListing.available_date ?? null,
    lease_term: dbListing.lease_term ?? null,
    deposit: dbListing.deposit ?? null,
    utilities: dbListing.utilities ?? null,
    pets_allowed: dbListing.pets_allowed ?? null,
  } as any

  const similarListings = (similarRows ?? []).map((l: any) => ({
    id: l.id,
    address: l.address,
    city: l.city,
    state: l.state,
    rent: l.rent,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    type: l.type,
    img: l.images?.[0] ?? '',
  }))

  return (
    <ListingDetail
      listing={listing}
      landlordProfile={landlordProfile ?? undefined}
      similarListings={similarListings}
    />
  )
}
