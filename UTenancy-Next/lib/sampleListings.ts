export type SampleListing = {
  id: string
  title: string
  location: string
  price: number
  beds: number
  baths: number
  type: 'open' | 'group'
  img: string
  interested: number
  university?: string
  distanceMi?: number
  availableDate?: string
}

export const SAMPLE_LISTINGS: SampleListing[] = [
  {
    id: 'sample-1',
    title: '3810 S Figueroa St',
    location: 'Los Angeles, CA',
    price: 1150,
    beds: 1,
    baths: 1,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
    interested: 12,
    university: 'USC',
    distanceMi: 0.3,
  },
  {
    id: 'sample-2',
    title: '1450 S Bundy Dr',
    location: 'Los Angeles, CA',
    price: 1050,
    beds: 2,
    baths: 1,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    interested: 8,
    university: 'LMU',
    distanceMi: 1.8,
  },
  {
    id: 'sample-3',
    title: '2340 Barry Ave',
    location: 'Los Angeles, CA',
    price: 1250,
    beds: 1,
    baths: 1,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80',
    interested: 5,
    university: 'LMU',
    distanceMi: 0.7,
  },
  {
    id: 'sample-4',
    title: '906 W 34th St',
    location: 'Los Angeles, CA',
    price: 1400,
    beds: 3,
    baths: 2,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    interested: 19,
    university: 'USC',
    distanceMi: 0.2,
  },
  {
    id: 'sample-5',
    title: '8920 Sepulveda Blvd',
    location: 'Los Angeles, CA',
    price: 1100,
    beds: 2,
    baths: 2,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    interested: 6,
    university: 'LMU',
    distanceMi: 2.2,
  },
  {
    id: 'sample-6',
    title: '5621 W Pico Blvd',
    location: 'Los Angeles, CA',
    price: 990,
    beds: 1,
    baths: 1,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
    interested: 3,
    availableDate: '2025-09-01',
  },
  {
    id: 'sample-7',
    title: '1825 N Vermont Ave',
    location: 'Los Angeles, CA',
    price: 1050,
    beds: 2,
    baths: 1,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    interested: 9,
    availableDate: '2025-08-15',
  },
  {
    id: 'sample-8',
    title: '4123 S Hoover St',
    location: 'Los Angeles, CA',
    price: 1350,
    beds: 3,
    baths: 2,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600&q=80',
    interested: 14,
    university: 'USC',
    distanceMi: 0.5,
  },
  {
    id: 'sample-9',
    title: '6723 Lincoln Blvd',
    location: 'Marina Del Rey, CA',
    price: 1400,
    beds: 1,
    baths: 1,
    type: 'open',
    img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    interested: 11,
    university: 'LMU',
    distanceMi: 3.1,
  },
]
