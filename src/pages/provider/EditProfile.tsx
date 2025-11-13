import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ProviderProfileForm } from "../../../components/provider-profile-form"
import { useSupabase } from "../../contexts/SupabaseContext"
import type { User } from "@supabase/supabase-js"
import type { ProviderProfile } from "../../../lib/types"

export default function EditProviderProfilePage() {
  const navigate = useNavigate()
  const { user } = useSupabase()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Get profile with services
      const { data: profileData } = await supabase
        .from("provider_profiles")
        .select(`
          *,
          services:provider_services(*)
        `)
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (!profileData) {
        navigate("/provider/profile/new")
        return
      }
      
      setProfile(profileData)
      setProfileLoading(false)
    }
    
    if (user) {
      fetchData()
    }
  }, [navigate, user])

  if (profileLoading || !user || !profile) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Your Provider Profile</h1>
        <p className="mt-2 text-muted-foreground">Update your information to attract more clients</p>
      </div>
      <ProviderProfileForm userId={user.id} existingProfile={profile} />
    </div>
  )
}
