import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ProviderProfileForm } from "../../../components/provider-profile-form"
import { useSupabase } from "../../SupabaseContext"
import type { User } from "@supabase/supabase-js"

export default function NewProviderProfilePage() {
  const navigate = useNavigate()
  const { user } = useSupabase()
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileExists, setProfileExists] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("provider_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (existingProfile) {
        navigate("/provider/profile/edit")
        return
      }
      
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
    <div className="container mx-auto max-w-2xl p-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Your Provider Profile</h1>
        <p className="mt-2 text-muted-foreground">Fill out your profile to start connecting with clients</p>
      </div>
      <ProviderProfileForm userId={user.id} />
    </div>
  )
}
