// Server component — handles static params + data fetching
import { notFound } from 'next/navigation'
import { getListingBySlug, LISTINGS } from '@/lib/listings'
import { createServerClient } from '@/lib/supabase-server'
import ListingDetail from './ListingDetail'

// Force dynamic rendering so DB listing data is never stale-cached
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Try mock listing first
  const listing = getListingBySlug(slug)
  if (listing) {
    const title = `${listing.title} — UTenancy Student Housing`
    const description = listing.description
    return {
      title,
      description,
      alternates: { canonical: `https://utenancy.com/listings/${listing.slug}` },
      openGraph: {
        title,
        description,
        images: listing.img
          ? [{ url: listing.img, width: 1200, height: 630, alt: listing.title }]
          : [{ url: '/og-image.png' }],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title,
        description,
        images: listing.img ? [listing.img] : ['/og-image.png'],
      },
    }
  }

  // Try DB listing (slug might be a UUID)
  const supabase = createServerClient()
  const { data } = await supabase
    .from('listings')
    .select('address, city, state, description, rent, bedrooms, images')
    .eq('id', slug)
    .single()

  if (data) {
    const title = `${data.address}, ${data.city} — UTenancy Student Housing`
    const description = data.description
      ?? `${data.bedrooms}BR in ${data.city}, ${data.state} — $${data.rent}/mo on UTenancy`
    const ogImage = data.images?.[0]
    return {
      title,
      description,
      alternates: { canonical: `https://utenancy.com/listings/${slug}` },
      openGraph: {
        title,
        description,
        images: ogImage
          ? [{ url: ogImage, width: 1200, height: 630, alt: `${data.address} listing photo` }]
          : [{ url: '/og-image.png' }],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title,
        description,
        images: ogImage ? [ogImage] : ['/og-image.png'],
      },
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
    landlord_id: dbListing.landlord_id ?? null,
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

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://utenancy.com' },
      { '@type': 'ListItem', position: 2, name: 'Listings', item: 'https://utenancy.com/listings' },
      { '@type': 'ListItem', position: 3, name: `${dbListing.address}, ${dbListing.city}`, item: `https://utenancy.com/listings/${dbListing.id}` },
    ],
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: dbListing.address,
    description: dbListing.description ?? `${dbListing.bedrooms}BR apartment in ${dbListing.city}, ${dbListing.state}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: dbListing.address,
      addressLocality: dbListing.city,
      addressRegion: dbListing.state,
      addressCountry: 'US',
    },
    numberOfRooms: dbListing.bedrooms,
    url: `https://utenancy.com/listings/${dbListing.id}`,
    offers: {
      '@type': 'Offer',
      price: dbListing.rent,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    ...(dbListing.images?.[0] ? { image: dbListing.images[0] } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetail
        listing={listing}
        landlordProfile={landlordProfile ?? undefined}
        similarListings={similarListings}
      />
    </>
  )
}
