/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   UTenancy — Listings data & types
   In production these come from the database.
   For now this is the single source of truth
   for mock listings used across all pages.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export type ListingType = 'open' | 'group'

export interface Listing {
  id: number
  slug: string
  title: string
  location: string
  price: number          // per person/mo unless featured
  totalRent?: number     // for featured whole-home listings
  beds: number
  baths?: number
  type: ListingType
  interested: number
  img: string
  featured?: boolean
  distanceMi?: number
  university?: string
  description?: string
  amenities?: string[]
}

export const LISTINGS: Listing[] = [
  {
    id: 2,
    slug: 'the-beacon-collective',
    title: 'The Beacon Collective',
    location: 'Playa Vista, LA',
    price: 1450,
    beds: 2,
    type: 'open',
    interested: 12,
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=75',
  },
  {
    id: 3,
    slug: 'commonwealth-flats',
    title: 'Commonwealth Flats',
    location: 'Westchester, LA',
    price: 1800,
    beds: 4,
    type: 'group',
    interested: 28,
    img: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=75',
  },
  {
    id: 4,
    slug: 'fenway-garden-suites',
    title: 'Fenway Garden Suites',
    location: 'Culver City, LA',
    price: 1200,
    beds: 1,
    type: 'open',
    interested: 8,
    img: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=75',
  },
  {
    id: 5,
    slug: 'seaport-lofts',
    title: 'Seaport Lofts',
    location: 'Marina del Rey, LA',
    price: 2100,
    beds: 3,
    type: 'group',
    interested: 42,
    img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=75',
  },
  {
    id: 6,
    slug: 'highland-park-rooms',
    title: 'Highland Park Rooms',
    location: 'Highland Park, LA',
    price: 950,
    beds: 2,
    type: 'open',
    interested: 21,
    img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=75',
  },
  {
    id: 7,
    slug: 'the-south-end-reserve',
    title: 'The South End Reserve',
    location: 'Venice, LA',
    price: 1675,
    beds: 5,
    type: 'group',
    interested: 34,
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75',
  },
]

export function getListingBySlug(slug: string): Listing | undefined {
  return LISTINGS.find((l) => l.slug === slug)
}
