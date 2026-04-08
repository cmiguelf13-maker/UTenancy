import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * POST /api/waitlist
 * Body: { email: string, type: 'student' | 'landlord' }
 *
 * Saves the email to the waitlist table in Supabase.
 * Returns 200 on success, 409 if already signed up, 400 on bad input.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.email !== 'string' || !body.email.trim()) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  const type: 'student' | 'landlord' = body.type === 'landlord' ? 'landlord' : 'student'

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('waitlist')
    .insert({ email, type })

  if (error) {
    // Unique violation — already on the list
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already_registered' }, { status: 409 })
    }
    console.error('Waitlist insert error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
