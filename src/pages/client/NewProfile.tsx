import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ClientProfileForm } from "../../../components/client-profile-form"
import { useSupabase } from "../../contexts/SupabaseContext"
import type { User } from "@supabase/supabase-js"
import { Users } from "lucide-react"

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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-xl font-bold">ConnectPro</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-2">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl font-semibold tracking-tight">Create Your Client Profile</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Set up your profile to start browsing and connecting with service providers
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto max-w-3xl px-6 py-12">
        <ClientProfileForm />
      </div>
    </div>
  )
}
