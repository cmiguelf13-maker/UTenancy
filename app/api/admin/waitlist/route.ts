import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'cfernandez@utenancy.com'

/**
 * GET /api/admin/waitlist
 * Returns all waitlist entries. Requires a valid Supabase session
 * belonging to the admin account.
 */
export async function GET(req: NextRequest) {
  // Verify the caller is the admin via their Supabase JWT
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use anon client to verify the token / get the user
  const { createClient } = await import('@supabase/supabase-js')
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: userError } = await anonClient.auth.getUser(token)

  if (userError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch waitlist using service role (bypasses RLS)
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data })
}
