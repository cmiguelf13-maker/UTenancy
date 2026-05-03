import { NextRequest, NextResponse } from 'next/server'
import { SCHOOL_SLUG_MAP } from '@/lib/distance'

/**
 * POST /api/distances
 * Calculates walking distances from a property address to a list of schools
 * using the Google Maps Distance Matrix API.
 *
 * Body: { origin: string, city: string, schoolSlugs: string[], state?: string }
 * Returns: { results: Array<{ slug, short, name, distanceMi }> }
 */
export async function POST(req: NextRequest) {
  const { origin, city, schoolSlugs, state = 'CA' } = await req.json()

  const key =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!key) {
    return NextResponse.json(
      { error: 'No Google Maps API key configured' },
      { status: 500 },
    )
  }

  // Validate slugs
  const validSlugs: string[] = []
  for (let i = 0; i < schoolSlugs.length; i++) {
    if (SCHOOL_SLUG_MAP[schoolSlugs[i]]) validSlugs.push(schoolSlugs[i])
  }
  if (validSlugs.length === 0) {
    return NextResponse.json({ results: [] })
  }

  const originStr = `${origin}, ${city}, ${state}`
  const destinationParts: string[] = []
  for (let i = 0; i < validSlugs.length; i++) {
    destinationParts.push(SCHOOL_SLUG_MAP[validSlugs[i]].googleMapsName)
  }
  const destinations = destinationParts.join('|')

  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json` +
    `?origins=${encodeURIComponent(originStr)}` +
    `&destinations=${encodeURIComponent(destinations)}` +
    `&mode=walking` +
    `&units=imperial` +
    `&key=${key}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.status }, { status: 500 })
    }

    const row = data.rows?.[0]
    if (!row) return NextResponse.json({ results: [] })

    const results: Array<{
      slug: string
      short: string
      name: string
      distanceMi: number
    }> = []

    for (let i = 0; i < validSlugs.length; i++) {
      const slug = validSlugs[i]
      const uni = SCHOOL_SLUG_MAP[slug]
      const element = row.elements[i]
      if (!element || element.status !== 'OK') continue

      // element.distance.value is in metres
      const distanceMi = Math.round((element.distance.value / 1609.344) * 10) / 10
      results.push({ slug, short: uni.short, name: uni.name, distanceMi })
    }

    results.sort((a, b) => a.distanceMi - b.distanceMi)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch from Google Maps' },
      { status: 500 },
    )
  }
}
