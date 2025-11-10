export interface ProviderProfile {
  id: string
  user_id: string
  name: string
  age: number
  location: string
  hourly_rate: number
  bio: string | null
  images: string[]
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
  location: string
  bio: string | null
  preferences: string | null
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
