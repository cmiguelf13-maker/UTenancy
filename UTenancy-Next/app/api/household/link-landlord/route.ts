import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * POST /api/household/link-landlord
 *
 * Links a landlord account to an existing household so students can
 * pay rent directly via ACH / card. The caller must be the household admin.
 *
 * Body: { household_id: string, landlord_email: string }
 *
 * Response: { landlord: { id, first_name, last_name, stripe_connect_enabled } }
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  // Auth client (anon key) — verifies the calling student
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Admin client (service role) — needed to look up auth.users by email
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { household_id?: string; landlord_email?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { household_id, landlord_email } = body
  if (!household_id || !landlord_email) {
    return NextResponse.json({ error: 'household_id and landlord_email are required' }, { status: 400 })
  }

  // Verify caller is admin of the household
  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', household_id)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'Only the household admin can link a landlord' }, { status: 403 })
  }

  // Look up landlord by email via admin client
  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) {
    return NextResponse.json({ error: 'Could not search for landlord account' }, { status: 500 })
  }

  const landlordAuth = usersData.users.find(
    (u) => u.email?.toLowerCase() === landlord_email.trim().toLowerCase()
  )
  if (!landlordAuth) {
    return NextResponse.json({ error: 'No UTenancy account found with that email address' }, { status: 404 })
  }

  // Verify the found user is actually a landlord
  const { data: landlordProfile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, stripe_connect_id, stripe_connect_enabled')
    .eq('id', landlordAuth.id)
    .single()

  if (!landlordProfile || landlordProfile.role !== 'landlord') {
    return NextResponse.json({ error: 'That account is not registered as a landlord on UTenancy' }, { status: 400 })
  }

  // Link the landlord to the household
  const { error: updateErr } = await supabase
    .from('households')
    .update({ landlord_id: landlordAuth.id })
    .eq('id', household_id)

  if (updateErr) {
    return NextResponse.json({ error: 'Could not link landlord. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    landlord: {
      id:                    landlordProfile.id,
      first_name:            landlordProfile.first_name,
      last_name:             landlordProfile.last_name,
      stripe_connect_id:     landlordProfile.stripe_connect_id,
      stripe_connect_enabled: landlordProfile.stripe_connect_enabled,
    },
  })
}
