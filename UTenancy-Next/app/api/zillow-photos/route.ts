import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/zillow-photos?address=6570+W+84th+Place&city=Los+Angeles&state=CA
 *
 * Returns a Google Maps Street View embed URL for the property.
 * No API key required — uses the free embed endpoint.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const address = searchParams.get('address')?.trim()
  const city    = searchParams.get('city')?.trim()
  const state   = searchParams.get('state')?.trim() ?? 'CA'

  if (!address || !city) {
    return NextResponse.json({ error: 'address and city are required' }, { status: 400 })
  }

  // Build a Google Maps Street View static-style URL
  // This uses the embed URL which doesn't need an API key
  const query = encodeURIComponent(`${address}, ${city}, ${state}`)
  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=960x600&location=${query}&source=outdoor`

  // Return the street view URL as the primary image
  // The landlord page will use this as a default, but landlords can also upload their own photos
  return NextResponse.json({
    streetViewUrl,
    source: 'streetview',
  })
}
