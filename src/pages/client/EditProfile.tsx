import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ClientProfileForm } from "../../../components/client-profile-form"
import { useSupabase } from "../../SupabaseContext"
import type { User } from "@supabase/supabase-js"
import type { ClientProfile } from "../../../lib/types"

export default function EditClientProfilePage() {
  const navigate = useNavigate()
  const { user } = useSupabase()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Get profile data
      const { data: profileData } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (!profileData) {
        navigate("/client/profile/new")
        return
      }
      
      setProfile(profileData)
      setProfileLoading(false)
    }
    
    if (user) {
      fetchData()
    }
  }, [navigate, user])

  if (profileLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">ConnectPro</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Update your information</p>
        </div>

        {profile && <ClientProfileForm profile={profile} />}
      </div>
    </div>
  )
}
