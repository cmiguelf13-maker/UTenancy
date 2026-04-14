export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'pro'
export type SubscriptionStatus = 'free' | 'starter' | 'growth' | 'pro' | 'past_due' | 'cancelled'

export interface Profile {
  id: string
  role: 'student' | 'landlord'
  first_name: string | null
  last_name: string | null
  university: string | null
  major: string | null
  grad_year: string | null
  bio: string | null
  avatar_url: string | null
  sleep_time: string | null
  cleanliness: string | null
  noise: string | null
  guests: string | null
  smoking: boolean
  pets: boolean
  studying: string | null
  email: string | null
  phone: string | null
  company: string | null
  updated_at: string
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  subscription_tier: SubscriptionTier
}

// ── Household (post-move-in tenant group) ───────────────
export interface Household {
  id: string
  name: string
  listing_id: string | null
  created_by: string
  invite_code: string | null
  created_at: string
  // joined
  members?: HouseholdMember[]
  expenses?: HouseholdExpense[]
}

export interface HouseholdMember {
  household_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  // joined
  profile?: Profile
}

export type ExpenseCategory = 'rent' | 'electricity' | 'internet' | 'groceries' | 'supplies' | 'other'

export interface HouseholdExpense {
  id: string
  household_id: string
  title: string
  amount: number
  category: ExpenseCategory
  paid_by: string
  split_count: number
  status: 'pending' | 'settled'
  due_date: string | null
  notes: string | null
  document_url: string | null
  created_at: string
  // joined
  payer?: Profile
}

// ── API Keys (Pro tier) ─────────────────────────────────
export interface ApiKey {
  id: string
  landlord_id: string
  key_prefix: string
  name: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface Listing {
  id: string
  landlord_id: string
  address: string
  unit: string | null
  city: string
  state: string
  zip: string | null
  bedrooms: number
  bathrooms: number
  rent: number
  type: 'open-room' | 'group-formation'
  /** active = published; draft = incomplete; rented = filled; archived = closed out */
  status: 'active' | 'draft' | 'rented' | 'archived'
  description: string | null
  amenities: string[]
  images: string[]
  available_date: string | null
  lease_term: string | null
  deposit: number | null
  utilities: string | null
  pets_allowed: string | null
  created_at: string
  updated_at: string
  // optional joined fields
  landlord?: Profile
  interest_count?: Array<{ count: number }> | number
  application_count?: Array<{ count: number }> | number
}

export interface ListingInterest {
  id: string
  listing_id: string
  student_id: string
  message: string | null
  created_at: string
  // joined
  profile?: Profile
}

export interface Conversation {
  id: string
  listing_id: string | null
  created_at: string
  // joined
  participants?: Profile[]
  last_message?: Message
  listing?: Listing
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
  sender?: Profile
}
