import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { useSupabase } from "../../SupabaseContext"
import type { User } from "@supabase/supabase-js"
import { calculateAge } from "../../../lib/age-utils"
import { formatLocation } from "../../../lib/location-data"
import type { ClientProfile } from "../../../lib/types"

export default function ClientProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Check if user has a client profile
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
  
  const handleSignOut = async () => {
    await signOut()
    navigate("/auth/login")
  }

  if (profileLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/client/subscription">Subscription</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/referrals">Referrals</Link>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button asChild>
            <Link to="/client/profile/edit">Edit Profile</Link>
          </Button>
        </div>

        <div className="space-y-6 rounded-lg border bg-card p-6">
          {profile?.photo_url && (
            <div className="flex justify-center">
              <img
                src={profile.photo_url}
                alt={profile.name}
                className="h-32 w-32 rounded-full object-cover border-4 border-primary/10"
              />
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Name</h2>
            <p className="mt-1 text-lg">{profile?.name}</p>
          </div>

          {profile?.date_of_birth && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Age</h2>
              <p className="mt-1 text-lg">{calculateAge(profile.date_of_birth)} years</p>
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Location</h2>
            <p className="mt-1 text-lg">
              {profile?.country && profile?.city
                ? formatLocation(profile.country, profile.city, profile.area || undefined)
                : profile?.location || "Not specified"}
            </p>
          </div>

          {profile?.bio && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Bio</h2>
              <p className="mt-1 text-lg">{profile.bio}</p>
            </div>
          )}

          {profile?.preferences && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Preferences</h2>
              <p className="mt-1 text-lg">{profile.preferences}</p>
            </div>
          )}

          <div className="pt-4 text-sm text-muted-foreground">
            <p>Profile created: {profile && new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
