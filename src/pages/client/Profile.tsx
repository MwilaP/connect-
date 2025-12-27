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
              <Link to="/client/subscription">Subscription</Link>
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

      <div className="container mx-auto max-w-5xl px-6 py-12">
        {/* Profile Header with Avatar */}
        <Card className="mb-8 overflow-hidden border border-gray-200 shadow-sm rounded-2xl">
          <div className="h-32 bg-gradient-to-b from-gray-50 to-white" />
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 sm:-mt-12">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                {profile?.photo_url && <AvatarImage src={profile.photo_url} alt={profile?.name || "User"} />}
                <AvatarFallback className="text-4xl bg-gray-100">
                  {profile?.name?.charAt(0).toUpperCase() || <UserIcon className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-semibold text-gray-900">{profile?.name}</h1>
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
              <Button size="lg" className="w-full sm:w-auto rounded-full" asChild>
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
            <Card className="md:col-span-2 border border-gray-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Personal Information */}
          <Card className="border border-gray-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
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
            <Card className="border border-gray-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">{profile.preferences}</p>
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
