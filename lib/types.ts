export interface ProviderService {
  id: string
  provider_id: string
  service_name: string
  price: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface ProviderProfile {
  id: string
  user_id: string
  name: string
  age?: number | null
  date_of_birth?: string | null
  location: string // Legacy field, kept for backward compatibility
  country?: string | null
  city?: string | null
  area?: string | null
  hourly_rate?: number | null
  bio: string | null
  images: string[]
  contact_number?: string | null
  services?: ProviderService[]
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
}

export interface ClientProfile {
  id: string
  user_id: string
  name: string
  date_of_birth: string | null
  location: string // Legacy field, kept for backward compatibility
  country?: string | null
  city?: string | null
  area?: string | null
  bio: string | null
  preferences: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileView {
  id: string
  provider_id: string
  viewer_id: string | null
  viewed_at: string
}

export interface ProfileStats {
  total_views: number
  views_last_7_days: number
  views_last_30_days: number
}
