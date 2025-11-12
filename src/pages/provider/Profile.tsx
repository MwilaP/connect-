import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { useSupabase } from "../../SupabaseContext"
import { getProviderAge } from "../../../lib/age-utils"
import { formatLocation } from "../../../lib/location-data"
import type { User } from "@supabase/supabase-js"
import type { ProviderProfile } from "../../../lib/types"

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/provider/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Provider Profile</h1>
          <Button asChild>
            <Link to="/provider/profile/edit">Edit Profile</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{profile?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {profile && getProviderAge(profile) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Age</p>
                  <p className="text-lg">{getProviderAge(profile)} years old</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-lg">
                  {profile?.country && profile?.city
                    ? formatLocation(profile.country, profile.city, profile.area || undefined)
                    : profile?.location || "Not specified"}
                </p>
              </div>
              {profile?.contact_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                  <p className="text-lg">{profile.contact_number}</p>
                </div>
              )}
            </div>

            {profile?.services && profile.services.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Services Offered</p>
                <div className="space-y-3">
                  {profile.services.map((service) => (
                    <div key={service.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{service.service_name}</p>
                          {service.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          K{service.price}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile?.bio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bio</p>
                <p className="mt-2 text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {profile?.images && profile.images.length > 0 && (
              <div>
                <p className="mb-4 text-sm font-medium text-muted-foreground">Photos</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {profile.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Profile photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
