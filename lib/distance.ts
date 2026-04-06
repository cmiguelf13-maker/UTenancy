/**
 * Distance calculation utilities — compute distance from a property to
 * the nearest supported university using the Haversine formula.
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
  { name: 'Loyola Marymount University (LMU)', short: 'LMU',            lat: 33.9709, lng: -118.4175 },
  { name: 'UCLA',                               short: 'UCLA',          lat: 33.9519, lng: -118.4559 },
  { name: 'USC',                                 short: 'USC',           lat: 34.0224, lng: -118.2851 },
  { name: 'Cal State LA',                        short: 'Cal State LA',  lat: 34.0663, lng: -118.1684 },
  { name: 'Pepperdine University',               short: 'Pepperdine',    lat: 34.0361, lng: -118.7094 },
  { name: 'UC Berkeley',                         short: 'UC Berkeley',   lat: 37.8719, lng: -122.2585 },
  { name: 'Stanford University',                 short: 'Stanford',      lat: 37.4275, lng: -122.1697 },
  { name: 'NYU',                                 short: 'NYU',           lat: 40.7291, lng: -73.9965 },
  { name: 'Boston University',                   short: 'Boston U',      lat: 42.3505, lng: -71.1054 },
  { name: 'University of Miami',                 short: 'U of Miami',    lat: 25.7215, lng: -80.2793 },
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

  for (const uni of UNIVERSITY_COORDS) {
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
