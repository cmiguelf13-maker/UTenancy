import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/zillow-photos?address=6570+W+84th+Place&city=Los+Angeles&state=CA
 *
 * Looks up the property on Zillow and returns an array of
 * photos.zillowstatic.com image URLs.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const address = searchParams.get('address')?.trim()
  const city    = searchParams.get('city')?.trim()
  const state   = searchParams.get('state')?.trim() ?? 'CA'

  if (!address || !city) {
    return NextResponse.json({ error: 'address and city are required' }, { status: 400 })
  }

  try {
    const photos = await fetchZillowPhotos(address, city, state)
    return NextResponse.json({ photos })
  } catch (err: any) {
    console.error('[zillow-photos] Error:', err.message)
    return NextResponse.json({ photos: [], error: err.message }, { status: 200 })
  }
}

/* ── helpers ───────────────────────────────────── */

function slugify(address: string, city: string, state: string): string {
  // "6570 W 84th Place, Los Angeles, CA" → "6570-W-84th-Place-Los-Angeles-CA"
  return `${address}, ${city}, ${state}`
    .replace(/[^\w\s-]/g, '')   // strip punctuation except hyphens
    .replace(/\s+/g, '-')       // spaces → dashes
}

async function fetchZillowPhotos(
  address: string,
  city: string,
  state: string,
): Promise<string[]> {
  const slug = slugify(address, city, state)
  const url = `https://www.zillow.com/homes/${encodeURIComponent(slug)}_rb/`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    next: { revalidate: 86400 }, // cache 24 h
  })

  if (!res.ok) {
    throw new Error(`Zillow returned ${res.status}`)
  }

  const html = await res.text()

  // ── Strategy 1: extract from __NEXT_DATA__ or embedded JSON ──
  const jsonPhotos = extractFromEmbeddedJSON(html)
  if (jsonPhotos.length > 0) return jsonPhotos

  // ── Strategy 2: regex scan for all zillowstatic photo URLs ──
  const regexPhotos = extractByRegex(html)
  if (regexPhotos.length > 0) return regexPhotos

  return []
}

/** Pull photo URLs from the large JSON blob Zillow embeds in script tags */
function extractFromEmbeddedJSON(html: string): string[] {
  const photos: string[] = []

  // Look for __NEXT_DATA__ script
  const nextDataMatch = html.match(
    /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  )
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1])
      collectZillowUrls(data, photos, 0)
    } catch { /* ignore parse errors */ }
  }

  // Also check for other large embedded JSON (Zillow uses various patterns)
  const scriptBlocks = html.match(
    /<script[^>]*>(\{[\s\S]{500,}?\})<\/script>/g,
  )
  if (scriptBlocks) {
    for (const block of scriptBlocks) {
      const jsonStr = block.replace(/<\/?script[^>]*>/g, '')
      try {
        const data = JSON.parse(jsonStr)
        collectZillowUrls(data, photos, 0)
      } catch { /* ignore */ }
    }
  }

  return dedup(photos)
}

/** Recursively walk a JSON structure and collect zillowstatic photo URLs */
function collectZillowUrls(obj: any, out: string[], depth: number): void {
  if (depth > 15 || !obj) return
  if (typeof obj === 'string') {
    if (isZillowPhoto(obj)) out.push(normalizeUrl(obj))
    return
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectZillowUrls(item, out, depth + 1)
    return
  }
  if (typeof obj === 'object') {
    for (const val of Object.values(obj)) collectZillowUrls(val, out, depth + 1)
  }
}

/** Regex fallback — find all zillowstatic photo URLs in raw HTML */
function extractByRegex(html: string): string[] {
  const pattern =
    /https?:\/\/photos\.zillowstatic\.com\/fp\/[a-f0-9]+-[a-z_]+\d+\.(?:jpg|webp|png)/gi
  const matches = html.match(pattern) ?? []
  return dedup(matches.map(normalizeUrl))
}

function isZillowPhoto(url: string): boolean {
  return (
    url.includes('photos.zillowstatic.com/fp/') &&
    /\.(jpg|webp|png)/i.test(url)
  )
}

/** Prefer the larger 960-width version */
function normalizeUrl(url: string): string {
  return url.replace(/cc_ft_\d+/, 'cc_ft_960')
}

function dedup(urls: string[]): string[] {
  // Deduplicate by the hash portion (the bit between /fp/ and the size suffix)
  const seen = new Set<string>()
  const result: string[] = []
  for (const u of urls) {
    const hash = u.match(/\/fp\/([a-f0-9]+)/)?.[1]
    if (hash && !seen.has(hash)) {
      seen.add(hash)
      result.push(u)
    }
  }
  return result.slice(0, 20) // cap at 20 photos
}
