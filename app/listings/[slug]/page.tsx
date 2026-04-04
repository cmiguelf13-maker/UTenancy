// Server component — handles static params + data fetching
import { notFound } from 'next/navigation'
import { getListingBySlug, LISTINGS } from '@/lib/listings'
import ListingDetail from './ListingDetail'

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ slug: l.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const listing = getListingBySlug(params.slug)
  if (!listing) return {}
  return {
    title: `${listing.title} — UTenancy Student Housing`,
    description: listing.description,
  }
}

export default function ListingPage({ params }: { params: { slug: string } }) {
  const listing = getListingBySlug(params.slug)
  if (!listing) notFound()
  return <ListingDetail listing={listing} />
}
