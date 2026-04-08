import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'cfernandez@utenancy.com'

/**
 * GET /api/admin/waitlist
 * Requires a valid Supabase session belonging to the admin account.
 * Uses the service-role key to fetch waitlist data (bypasses RLS).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the token belongs to the admin
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: userError } = await anonClient.auth.getUser(token)

  if (userError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch all waitlist entries using the service-role key (bypasses RLS)
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
