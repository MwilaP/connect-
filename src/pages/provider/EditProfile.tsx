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
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Header Skeleton */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
          <div className="container mx-auto flex h-14 sm:h-20 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/20 animate-pulse" />
              <div className="h-6 w-32 bg-primary/20 rounded animate-pulse" />
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-9 w-24 bg-muted rounded animate-pulse" />
              <div className="h-9 w-24 bg-muted rounded animate-pulse" />
              <div className="h-9 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
          {/* Loading Content */}
          <div className="space-y-6">
            {/* Back Button Skeleton */}
            <div className="h-9 w-32 bg-muted rounded animate-pulse" />
            
            {/* Header Skeleton */}
            <div className="space-y-3">
              <div className="h-8 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-96 bg-muted/60 rounded animate-pulse" />
            </div>

            {/* Card Skeleton */}
            <div className="border rounded-lg shadow-lg bg-card p-6 space-y-6">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-full max-w-2xl bg-muted/60 rounded animate-pulse" />
              </div>
              
              {/* Form Fields Skeleton */}
              <div className="space-y-8">
                {/* Section 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-32 bg-muted/60 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
                    <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
                    <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-40 bg-muted/60 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
                    <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
                  </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-44 bg-muted/60 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-32 w-full bg-muted/40 rounded animate-pulse" />
                </div>
              </div>

              {/* Buttons Skeleton */}
              <div className="flex gap-4 pt-4">
                <div className="h-12 flex-1 bg-primary/20 rounded animate-pulse" />
                <div className="h-12 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="fixed bottom-8 right-8 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Loading profile...</span>
          </div>
        </div>
      </div>
    )
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
