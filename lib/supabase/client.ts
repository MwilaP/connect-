import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// Create a single supabase client for interacting with your database
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance
  
  supabaseInstance = createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
  
  return supabaseInstance
}
