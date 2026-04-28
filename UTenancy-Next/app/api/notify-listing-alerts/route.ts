import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { listingId } = body ?? {}
  if (!listingId) {
    return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
  }

  /* ── Auth: verify caller is a landlord who owns this listing ── */
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /* ── Fetch listing and verify ownership ── */
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('id, address, city, state, rent, bedrooms, bathrooms, type, notified_at, status, landlord_id')
    .eq('id', listingId)
    .single()

  if (!listing || listing.landlord_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (listing.status !== 'active') {
    return NextResponse.json({ skipped: true, reason: 'not active' })
  }
  if (listing.notified_at) {
    return NextResponse.json({ skipped: true, reason: 'already notified' })
  }

  /* ── Fetch all alert subscribers ── */
  const { data: alerts } = await supabaseAdmin
    .from('listing_alerts')
    .select('email')

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const emails: string[] = alerts.map((a: { email: string }) => a.email)

  const bedsLabel = listing.bedrooms === 1 ? '1 bed' : `${listing.bedrooms} beds`
  const bathsLabel = listing.bathrooms === 1 ? '1 bath' : `${listing.bathrooms} baths`
  const typeLabel = listing.type === 'open-room' ? 'Open Room' : 'Full Place'
  const location = [listing.address, listing.city, listing.state ?? 'CA'].filter(Boolean).join(', ')
  const rentLabel = listing.rent ? `$${listing.rent.toLocaleString()}/mo` : ''
  const listingUrl = `https://utenancy.com/listings/${listing.id}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New listing on UTenancy</title>
</head>
<body style="margin:0;padding:0;background:#faf5f2;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#9c7060;padding:28px 40px;text-align:center;">
              <span style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">UTenancy</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#2e1e18;">
                A new listing just went live &#x1F3E0;
              </p>
              <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#6b4c3b;">
                You asked to be notified when new places are available. Here&apos;s the latest:
              </p>

              <!-- Listing card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#ede0d8;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#9c7060;text-transform:uppercase;letter-spacing:1px;">${typeLabel}</p>
                    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#2e1e18;">${location}</p>
                    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#6b4c3b;">${bedsLabel}&nbsp;&nbsp;&middot;&nbsp;&nbsp;${bathsLabel}${rentLabel ? `&nbsp;&nbsp;&middot;&nbsp;&nbsp;${rentLabel}` : ''}</p>
                    <a href="${listingUrl}"
                       style="display:inline-block;background:#9c7060;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:50px;">
                      View Listing &#x2192;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#9c7060;line-height:1.6;">
                Not finding the right fit yet? We&apos;ll keep watching and reach out as soon as more places come in.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf5f2;padding:20px 40px;text-align:center;border-top:1px solid #ede0d8;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#c4a090;">
                You&apos;re receiving this because you signed up for listing alerts at
                <a href="https://utenancy.com/listings" style="color:#9c7060;text-decoration:none;">utenancy.com</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  /* ── Send in batches of 50 (Resend batch limit) ── */
  let sent = 0
  const batchSize = 50
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const { error } = await resend.emails.send({
      from: 'UTenancy <noreply@utenancy.com>',
      to: batch,
      subject: `New listing just dropped — ${location}`,
      html,
    })
    if (!error) sent += batch.length
  }

  /* ── Mark listing as notified to prevent duplicate blasts ── */
  if (sent > 0) {
    await supabaseAdmin
      .from('listings')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', listingId)
  }

  return NextResponse.json({ sent })
}
