/**
 * Distance calculation utilities — compute distance from a property to
 * supported universities using the Haversine formula.
 *
 * University coordinates are hardcoded for the schools UTenancy supports.
 * Property coordinates are fetched from the OpenStreetMap Nominatim API
 * (free, no API key required, 1 req/sec rate limit).
 */

export interface UniversityLocation {
  name: string
  short: string
  lat: number
  lng: number
}

export const UNIVERSITY_COORDS: UniversityLocation[] = [
  { name: 'Loyola Marymount University',        short: 'LMU',        lat: 33.9709, lng: -118.4175 },
  { name: 'Otis College of Art and Design',     short: 'Otis',       lat: 33.9883, lng: -118.4232 },
  { name: 'University of Southern California',  short: 'USC',        lat: 34.0224, lng: -118.2851 },
  { name: 'UCLA',                               short: 'UCLA',       lat: 34.0689, lng: -118.4452 },
  { name: 'Pepperdine University',              short: 'Pepperdine', lat: 34.0359, lng: -118.7120 },
]

/** Map from a short slug (stored in DB) to the university entry */
export const SCHOOL_SLUG_MAP: Record<string, UniversityLocation> = {
  lmu:        UNIVERSITY_COORDS[0],
  otis:       UNIVERSITY_COORDS[1],
  usc:        UNIVERSITY_COORDS[2],
  ucla:       UNIVERSITY_COORDS[3],
  pepperdine: UNIVERSITY_COORDS[4],
}

/** Ordered list of schools for the picker UI */
export const SCHOOL_OPTIONS: Array<{ slug: string; label: string; short: string }> = [
  { slug: 'lmu',        label: 'Loyola Marymount University (LMU)',        short: 'LMU' },
  { slug: 'otis',       label: 'Otis College of Art and Design',           short: 'Otis' },
  { slug: 'usc',        label: 'University of Southern California (USC)',  short: 'USC' },
  { slug: 'ucla',       label: 'UCLA',                                     short: 'UCLA' },
  { slug: 'pepperdine', label: 'Pepperdine University',                    short: 'Pepperdine' },
]

/** Haversine distance in miles between two lat/lng points */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Find the nearest university and distance from given coordinates */
export function findNearestUniversity(lat: number, lng: number): { university: UniversityLocation; distanceMi: number } {
  let nearest = UNIVERSITY_COORDS[0]
  let minDist = Infinity

  for (let i = 0; i < UNIVERSITY_COORDS.length; i++) {
    const uni = UNIVERSITY_COORDS[i]
    const d = haversineDistance(lat, lng, uni.lat, uni.lng)
    if (d < minDist) {
      minDist = d
      nearest = uni
    }
  }

  return { university: nearest, distanceMi: Math.round(minDist * 10) / 10 }
}

/**
 * Geocode an address using OpenStreetMap Nominatim (free, no API key).
 * Returns lat/lng or null if geocoding fails.
 */
export async function geocodeAddress(address: string, city: string, state = 'CA'): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state}, USA`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      { headers: { 'User-Agent': 'UTenancy/1.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

/**
 * Full pipeline: geocode address, find nearest university, return distance info.
 */
export async function getDistanceToNearestSchool(address: string, city: string, state = 'CA'): Promise<{ distanceMi: number; university: string } | null> {
  const coords = await geocodeAddress(address, city, state)
  if (!coords) return null
  const { university, distanceMi } = findNearestUniversity(coords.lat, coords.lng)
  return { distanceMi, university: university.short }
}

/**
 * Compute distances from a geocoded property to a specific list of school slugs.
 * Returns an array of { slug, short, name, distanceMi } sorted by distance.
 */
export async function getDistancesToSchools(
  address: string,
  city: string,
  schoolSlugs: string[],
  state = 'CA',
): Promise<Array<{ slug: string; short: string; name: string; distanceMi: number }>> {
  if (schoolSlugs.length === 0) return []
  const coords = await geocodeAddress(address, city, state)
  if (!coords) return []

  const results: Array<{ slug: string; short: string; name: string; distanceMi: number }> = []
  for (let i = 0; i < schoolSlugs.length; i++) {
    const slug = schoolSlugs[i]
    const uni = SCHOOL_SLUG_MAP[slug]
    if (!uni) continue
    const distanceMi = Math.round(haversineDistance(coords.lat, coords.lng, uni.lat, uni.lng) * 10) / 10
    results.push({ slug, short: uni.short, name: uni.name, distanceMi })
  }

  // Sort by closest first
  results.sort((a, b) => a.distanceMi - b.distanceMi)
  return results
}
