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
