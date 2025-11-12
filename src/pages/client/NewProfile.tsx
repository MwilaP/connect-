import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ClientProfileForm } from "../../../components/client-profile-form"
import { useSupabase } from "../../SupabaseContext"
import type { User } from "@supabase/supabase-js"

export default function NewClientProfilePage() {
  const navigate = useNavigate()
  const { user } = useSupabase()
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Check if user already has a profile
      const { data: existingProfile } = await supabase
        .from("client_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (existingProfile) {
        navigate("/client/profile")
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">ConnectPro</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Tell us about yourself to get started</p>
        </div>

        <ClientProfileForm />
      </div>
    </div>
  )
}
