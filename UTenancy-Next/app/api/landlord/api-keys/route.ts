import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function getUser(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase    = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
    },
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error, supabase }
}

/** GET /api/landlord/api-keys — list keys for the current landlord */
export async function GET(req: NextRequest) {
  const { user, error } = await getUser(req)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'landlord') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE)

  // Only allow Pro tier
  const { data: profile } = await admin.from('profiles').select('subscription_tier').eq('id', user.id).single()
  if (profile?.subscription_tier !== 'pro') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  const { data: keys, error: dbErr } = await admin
    .from('api_keys')
    .select('id, key_prefix, name, is_active, last_used_at, created_at')
    .eq('landlord_id', user.id)
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ keys })
}

/** POST /api/landlord/api-keys — generate a new key */
export async function POST(req: NextRequest) {
  const { user, error } = await getUser(req)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'landlord') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE)

  const { data: profile } = await admin.from('profiles').select('subscription_tier').eq('id', user.id).single()
  if (profile?.subscription_tier !== 'pro') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  const body     = await req.json().catch(() => ({}))
  const keyName  = (body?.name as string | undefined)?.trim() || 'Default Key'

  // Generate a random API key
  const rawKey   = `uten_${randomBytes(24).toString('hex')}`
  const prefix   = rawKey.slice(0, 12)           // first 12 chars (shown in UI)
  const keyHash  = createHash('sha256').update(rawKey).digest('hex')

  const { data: inserted, error: insertErr } = await admin
    .from('api_keys')
    .insert({ landlord_id: user.id, key_prefix: prefix, key_hash: keyHash, name: keyName })
    .select('id, key_prefix, name, is_active, created_at')
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Return the raw key ONCE — it is never stored in plain text
  return NextResponse.json({ key: rawKey, record: inserted }, { status: 201 })
}

/** DELETE /api/landlord/api-keys?id=<key-id> — revoke a key */
export async function DELETE(req: NextRequest) {
  const { user, error } = await getUser(req)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keyId = req.nextUrl.searchParams.get('id')
  if (!keyId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE)
  const { error: delErr } = await admin
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('landlord_id', user.id)   // ownership check

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
