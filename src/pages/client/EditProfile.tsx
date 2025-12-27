import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ClientProfileForm } from "../../../components/client-profile-form"
import { useSupabase } from "../../contexts/SupabaseContext"
import type { User } from "@supabase/supabase-js"
import type { ClientProfile } from "../../../lib/types"
import { BottomNav } from "../../components/BottomNav"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { ArrowLeft, Save } from "lucide-react"

export default function EditClientProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const handleSignOut = async () => {
    await signOut()
    navigate("/auth/login")
  }

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
    <div className="min-h-screen bg-white pb-16 sm:pb-0">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">C</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              ConnectPro
            </h1>
          </Link>
          
          {/* Desktop Navigation Only */}
          <nav className="hidden sm:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-gray-100" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-gray-100" asChild>
              <Link to="/client/profile">My Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-gray-100" asChild>
              <Link to="/referrals">Referrals</Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-gray-300" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 rounded-full hover:bg-gray-100" asChild>
            <Link to="/client/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-gray-900">Edit Your Profile</h1>
              <p className="mt-3 text-lg text-gray-600">Update your personal information and preferences</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
            <CardDescription className="text-base">
              Keep your profile up to date to help providers understand your needs better
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile && <ClientProfileForm profile={profile} />}
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav
        userRole="client"
        hasProviderProfile={false}
        hasClientProfile={true}
        onSignOut={handleSignOut}
      />
    </div>
  )
}
