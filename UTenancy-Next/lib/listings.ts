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
  availableDate?: string // ISO date string, e.g. "2026-05-01"
}

export const LISTINGS: Listing[] = [

  /* ── Westchester (walking distance to LMU) ── */
  {
    id: 2,
    slug: 'the-beacon-collective',
    title: '8919 Gulana Ave',
    location: 'Playa Vista, LA',
    price: 1450,
    beds: 2,
    baths: 1,
    type: 'open',
    interested: 12,
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=75',
    university: 'LMU',
    distanceMi: 0.8,
    description: 'Modern 2-bed unit in the heart of Playa Vista. Steps from LMU\'s campus with in-unit laundry and rooftop deck access. Fully furnished common areas.',
    amenities: ['In-unit laundry', 'Rooftop deck', 'Parking', 'AC', 'Pet-friendly'],
    availableDate: '2026-05-01',
  },
  {
    id: 3,
    slug: 'commonwealth-flats',
    title: '6416 W 87th St',
    location: 'Westchester, LA',
    price: 1800,
    beds: 4,
    baths: 2,
    type: 'group',
    interested: 28,
    img: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=75',
    university: 'LMU',
    distanceMi: 1.2,
    description: 'Spacious 4-bedroom house near LMU perfect for a full group. Large backyard, modern kitchen, and covered parking for 2 cars.',
    amenities: ['Backyard', 'Covered parking', 'Dishwasher', 'Washer/dryer', 'Fast WiFi'],
    availableDate: '2026-06-01',
  },
  {
    id: 4,
    slug: 'the-loyola-walk',
    title: '8726 Lincoln Blvd',
    location: 'Westchester, LA',
    price: 975,
    beds: 1,
    baths: 1,
    type: 'open',
    interested: 8,
    img: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=75',
    university: 'LMU',
    distanceMi: 0.3,
    description: 'Closest listing to LMU\'s main gate — just a 5-minute walk. Cozy 1-bed in a quiet residential building with private parking and in-unit laundry.',
    amenities: ['Walk to LMU', 'In-unit laundry', 'Private parking', 'AC', 'Quiet building'],
    availableDate: '2026-05-01',
  },
  {
    id: 5,
    slug: 'seaport-lofts',
    title: '4366 Via Marina #302',
    location: 'Marina del Rey, LA',
    price: 2100,
    beds: 3,
    baths: 2,
    type: 'group',
    interested: 42,
    img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=75',
    university: 'LMU',
    distanceMi: 1.9,
    description: 'High-ceiling loft-style 3-bed near the marina. Stunning views, open floor plan, and walking distance to the beach. 10-min bike to LMU.',
    amenities: ['Marina views', 'Rooftop terrace', 'Bike storage', 'Gym', 'Concierge'],
    availableDate: '2026-07-01',
  },
  {
    id: 6,
    slug: 'westchester-studios',
    title: '7846 W 83rd St',
    location: 'Westchester, LA',
    price: 1250,
    beds: 1,
    baths: 1,
    type: 'open',
    interested: 21,
    img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=75',
    university: 'LMU',
    distanceMi: 0.5,
    description: 'Bright and updated 1-bed just half a mile from LMU. Perfect for a solo student. New appliances, private entry, and 1 assigned parking spot.',
    amenities: ['Assigned parking', 'Private entry', 'New appliances', 'AC', 'Street-facing patio'],
    availableDate: '2026-05-15',
  },
  {
    id: 7,
    slug: 'the-south-end-reserve',
    title: '722 Brooks Ave',
    location: 'Venice, LA',
    price: 1675,
    beds: 5,
    baths: 3,
    type: 'group',
    interested: 34,
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=75',
    university: 'LMU',
    distanceMi: 3.1,
    description: 'Iconic Venice beach house for 5. Steps from Abbot Kinney and the boardwalk. Large living areas, outdoor patio, and all private bedrooms.',
    amenities: ['Outdoor patio', 'Beach access', 'Driveway parking', 'Full kitchen', 'Smart TV'],
    availableDate: '2026-06-15',
  },

  /* ── Marina del Rey & Playa del Rey ───────── */
  {
    id: 8,
    slug: 'lincoln-village-studios',
    title: '8300 Redlands St',
    location: 'Playa del Rey, LA',
    price: 1350,
    beds: 1,
    baths: 1,
    type: 'open',
    interested: 19,
    img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=75',
    university: 'LMU',
    distanceMi: 1.1,
    description: 'Renovated studio a mile from LMU with partial ocean views. Hardwood floors, quartz counters, and a dedicated parking spot. Beach bike path right outside.',
    amenities: ['Ocean views', 'Hardwood floors', 'Parking', 'Bike path access', 'In-unit laundry'],
    availableDate: '2026-05-01',
  },
  {
    id: 9,
    slug: 'dockside-suites',
    title: '4115 Via Marina #210',
    location: 'Marina del Rey, LA',
    price: 1900,
    beds: 2,
    baths: 2,
    type: 'open',
    interested: 37,
    img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=75',
    university: 'LMU',
    distanceMi: 1.6,
    description: 'Premium 2-bed/2-bath overlooking the marina. 15-min bike to LMU. Keyless entry, high-speed WiFi, and a rooftop lounge with sunset views.',
    amenities: ['Marina views', 'Keyless entry', 'Rooftop lounge', 'High-speed WiFi', 'EV charger'],
    availableDate: '2026-06-01',
  },

  /* ── Mar Vista & Culver City ──────────────── */
  {
    id: 10,
    slug: 'mar-vista-commons',
    title: '4235 Centinela Ave',
    location: 'Mar Vista, LA',
    price: 1550,
    beds: 3,
    baths: 2,
    type: 'group',
    interested: 15,
    img: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&q=75',
    university: 'LMU',
    distanceMi: 2.7,
    description: '3-bed bungalow in quiet Mar Vista — short bus ride to LMU. Renovated kitchen, private backyard, and a garage for bikes and boards.',
    amenities: ['Backyard', 'Garage', 'Renovated kitchen', 'Washer/dryer', 'Quiet street'],
    availableDate: '2026-06-01',
  },
  {
    id: 11,
    slug: 'fenway-garden-suites',
    title: '10445 Tabor St',
    location: 'Culver City, LA',
    price: 1200,
    beds: 1,
    baths: 1,
    type: 'open',
    interested: 11,
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=75',
    university: 'LMU',
    distanceMi: 2.4,
    description: 'Quiet 1-bed in a boutique Culver City complex with easy access to the Expo Line. 20-min bus ride to LMU. Walk to great restaurants and coffee shops.',
    amenities: ['In-unit laundry', 'Balcony', 'Street parking', 'AC', 'Gym access'],
    availableDate: '2026-05-15',
  },
  {
    id: 12,
    slug: 'the-palms-collective',
    title: '3416 Military Ave',
    location: 'Palms, LA',
    price: 1100,
    beds: 3,
    baths: 1,
    type: 'group',
    interested: 26,
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=75',
    university: 'LMU',
    distanceMi: 3.2,
    description: '3-bed group house in Palms with a big backyard. 20-min bus or 12-min bike to LMU. Community-feel neighborhood, great cafes, and easy freeway access.',
    amenities: ['Backyard', 'Washer/dryer', 'Street parking', 'Natural light', 'Updated bath'],
    availableDate: '2026-07-01',
  },

  /* ── Venice & El Segundo ──────────────────── */
  {
    id: 13,
    slug: 'venice-beach-bungalow',
    title: '524 Brooks Ave',
    location: 'Venice, LA',
    price: 1600,
    beds: 2,
    baths: 1,
    type: 'open',
    interested: 44,
    img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=75',
    university: 'LMU',
    distanceMi: 2.9,
    description: 'Classic Venice bungalow two blocks from the beach. Open-plan 2-bed with original hardwood floors and a private deck. 15-min Uber or bike to LMU.',
    amenities: ['Beach 2 blocks', 'Private deck', 'Hardwood floors', 'Parking', 'Outdoor shower'],
    availableDate: '2026-05-01',
  },
  {
    id: 14,
    slug: 'el-segundo-flats',
    title: '430 Main St #4',
    location: 'El Segundo, LA',
    price: 1050,
    beds: 2,
    baths: 1,
    type: 'open',
    interested: 9,
    img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=75',
    university: 'LMU',
    distanceMi: 2.8,
    description: 'Under-the-radar 2-bed in quiet El Segundo. Great value, close to the beach bike path, and a straight 12-min drive up Lincoln to LMU.',
    amenities: ['Garage parking', 'Washer/dryer', 'Central AC', 'Quiet block', 'Storage unit'],
    availableDate: '2026-08-01',
  },

  /* ── Inglewood ────────────────────────────── */
  {
    id: 15,
    slug: 'the-inglewood-collective',
    title: '3217 W 78th St',
    location: 'Inglewood, LA',
    price: 900,
    beds: 4,
    baths: 2,
    type: 'group',
    interested: 31,
    img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=75',
    university: 'LMU',
    distanceMi: 3.5,
    description: 'Best value 4-bed near LMU. Private driveway, huge kitchen, and a backyard with a fire pit. 20-min bus or 15-min drive to campus.',
    amenities: ['Private driveway', 'Backyard + fire pit', 'Full kitchen', 'Washer/dryer', 'Large bedrooms'],
    availableDate: '2026-06-01',
  },
  {
    id: 16,
    slug: 'slauson-house',
    title: '2918 W 84th St',
    location: 'Inglewood, LA',
    price: 850,
    beds: 5,
    baths: 2,
    type: 'group',
    interested: 18,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75',
    university: 'LMU',
    distanceMi: 3.8,
    description: 'Biggest group house in the listings — 5 beds and 2 baths for under $900/person. Dedicated study room, large yard, and plenty of common space.',
    amenities: ['Study room', 'Large yard', 'Driveway parking', 'Shared laundry', 'High ceilings'],
    availableDate: '2026-07-01',
  },
]

export function getListingBySlug(slug: string): Listing | undefined {
  return LISTINGS.find((l) => l.slug === slug)
}
