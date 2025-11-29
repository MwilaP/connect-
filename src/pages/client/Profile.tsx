import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { useSupabase } from "../../contexts/SupabaseContext"
import type { User } from "@supabase/supabase-js"
import { calculateAge } from "../../../lib/age-utils"
import { formatLocation } from "../../../lib/location-data"
import type { ClientProfile } from "../../../lib/types"
import { BottomNav } from "../../components/BottomNav"
import { MapPin, Calendar, Mail, Edit, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"

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
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" className="touch-target" asChild>
              <Link to="/client/subscription">Subscription</Link>
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

      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {/* Profile Header with Avatar */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
          <CardContent className="relative px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 -mt-16 sm:-mt-12">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                {profile?.photo_url && <AvatarImage src={profile.photo_url} alt={profile?.name || "User"} />}
                <AvatarFallback className="text-2xl sm:text-4xl bg-primary/10">
                  {profile?.name?.charAt(0).toUpperCase() || <UserIcon className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{profile?.name}</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-muted-foreground">
                  {profile?.country && profile?.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{formatLocation(profile.country, profile.city, profile.area || undefined)}</span>
                    </div>
                  )}
                  {profile?.date_of_birth && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{calculateAge(profile.date_of_birth)} years old</span>
                    </div>
                  )}
                </div>
              </div>
              <Button size="lg" className="w-full sm:w-auto touch-target" asChild>
                <Link to="/client/profile/edit">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* About Card */}
          {profile?.bio && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                <span className="text-sm font-semibold text-right">{profile?.name}</span>
              </div>
              {profile?.date_of_birth && (
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Age</span>
                  <span className="text-sm font-semibold">{calculateAge(profile.date_of_birth)} years</span>
                </div>
              )}
              <div className="flex items-start justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Location</span>
                <span className="text-sm font-semibold text-right">
                  {profile?.country && profile?.city
                    ? formatLocation(profile.country, profile.city, profile.area || undefined)
                    : profile?.location || "Not specified"}
                </span>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                <span className="text-sm font-semibold">
                  {profile && new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          {profile?.preferences && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.preferences}</p>
              </CardContent>
            </Card>
          )}
        </div>
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
