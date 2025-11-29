import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ProviderProfileForm } from "../../../components/provider-profile-form"
import { useSupabase } from "../../contexts/SupabaseContext"
import type { User } from "@supabase/supabase-js"
import type { ProviderProfile } from "../../../lib/types"
import { BottomNav } from "../../components/BottomNav"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { ArrowLeft, Briefcase } from "lucide-react"

export default function EditProviderProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
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
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      {/* Simplified Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex h-14 sm:h-20 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-primary-foreground">C</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ConnectPro
            </h1>
          </Link>
          
          {/* Desktop Navigation Only */}
          <nav className="hidden sm:flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link to="/provider/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link to="/referrals">Referrals</Link>
            </Button>
            <Button variant="outline" size="sm" className="touch-target" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link to="/provider/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Briefcase className="h-7 w-7 sm:h-8 sm:w-8" />
                Edit Provider Profile
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Update your information to attract more clients and showcase your services
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Professional Information</CardTitle>
            <CardDescription>
              Complete your profile with accurate information. High-quality profiles get more visibility and client inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProviderProfileForm userId={user.id} existingProfile={profile} />
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav
        userRole="provider"
        hasProviderProfile={true}
        hasClientProfile={false}
        onSignOut={handleSignOut}
      />
    </div>
  )
}
