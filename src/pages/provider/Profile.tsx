import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { useSupabase } from "../../contexts/SupabaseContext"
import { getProviderAge } from "../../../lib/age-utils"
import { formatLocation } from "../../../lib/location-data"
import type { User } from "@supabase/supabase-js"
import type { ProviderProfile } from "../../../lib/types"
import { BottomNav } from "../../components/BottomNav"
import { MapPin, Calendar, Phone, Edit, User as UserIcon, Briefcase, DollarSign, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"

export default function ProviderProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Check if provider profile exists
      const { data: profileData } = await supabase
        .from("provider_profiles")
        .select(`
          *,
          services:provider_services(*)
        `)
        .eq("user_id", user.id)
        .single()
      
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
              <Link to="/provider/dashboard">Dashboard</Link>
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

      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Profile Header with Avatar */}
        <Card className="mb-8 overflow-hidden border border-gray-200 shadow-sm rounded-2xl">
          <div className="h-32 bg-gradient-to-b from-gray-50 to-white" />
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 sm:-mt-12">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.images?.[0]} alt={profile?.name} />
                <AvatarFallback className="text-4xl bg-gray-100">
                  {profile?.name?.charAt(0).toUpperCase() || <UserIcon className="h-12 w-12" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-semibold text-gray-900">{profile?.name}</h1>
                  <Badge variant="secondary" className="hidden sm:inline-flex bg-amber-100 text-amber-700 border-0">
                    <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                    Provider
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-muted-foreground">
                  {profile?.country && profile?.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{formatLocation(profile.country, profile.city, profile.area || undefined)}</span>
                    </div>
                  )}
                  {profile && getProviderAge(profile) && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{getProviderAge(profile)} years old</span>
                    </div>
                  )}
                  {profile?.contact_number && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      <span>{profile.contact_number}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button size="lg" className="w-full sm:w-auto rounded-full" asChild>
                <Link to="/provider/profile/edit">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* About Card */}
          {profile?.bio && (
            <Card className="lg:col-span-2 border border-gray-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  About Me
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Info Card */}
          <Card className="border border-gray-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile && getProviderAge(profile) && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">Age</span>
                  <span className="text-sm font-semibold">{getProviderAge(profile)} years</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Location</span>
                <span className="text-sm font-semibold text-right">
                  {profile?.country && profile?.city
                    ? formatLocation(profile.country, profile.city, profile.area || undefined)
                    : profile?.location || "Not specified"}
                </span>
              </div>
              {profile?.contact_number && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Contact</span>
                  <span className="text-sm font-semibold">{profile.contact_number}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services Card */}
          {profile?.services && profile.services.length > 0 && (
            <Card className="lg:col-span-3 border border-gray-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Services Offered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.services.map((service) => (
                    <Card key={service.id} className="border border-gray-200 shadow-sm rounded-xl hover:shadow-md hover:border-gray-300 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-base">{service.service_name}</h3>
                          <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            K{service.price}
                          </Badge>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos Gallery */}
          {profile?.images && profile.images.length > 0 && (
            <Card className="lg:col-span-3 border border-gray-200 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Photo Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profile.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Profile photo ${index + 1}`}
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
