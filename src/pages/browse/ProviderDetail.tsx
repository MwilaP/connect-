import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { MapPin, DollarSign, User } from "lucide-react"
import type { ProviderProfile } from "../../../lib/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError("Provider ID not found")
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Get provider profile
      const { data: providerData, error: providerError } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("id", id)
        .single()

      if (providerError || !providerData) {
        setError("Provider not found")
        setLoading(false)
        return
      }

      setProvider(providerData)

      // Record the profile view if user is logged in
      if (currentUser) {
        // Don't await to avoid blocking page render
        supabase
          .from("profile_views")
          .insert({
            provider_id: providerData.id,
            viewer_id: currentUser.id,
          })
          .then(({ error: viewError }) => {
            if (viewError) {
              console.error("Error tracking profile view:", viewError)
            }
          })
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate("/auth/login")
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (error || !provider) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="mt-2 text-muted-foreground">{error || "Provider not found"}</p>
          <Button asChild className="mt-4">
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{provider.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Info */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-5 w-5" />
                <span>{provider.age} years old</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{provider.location}</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-primary">
                <DollarSign className="h-5 w-5" />
                <span>${provider.hourly_rate}/hour</span>
              </div>
            </div>

            {/* Bio */}
            {provider.bio && (
              <div>
                <h3 className="mb-2 text-lg font-semibold">About</h3>
                <p className="text-muted-foreground leading-relaxed">{provider.bio}</p>
              </div>
            )}

            {/* Images */}
            {provider.images && provider.images.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Photos</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {provider.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-video overflow-hidden rounded-lg border">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${provider.name} photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Button */}
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="flex-1">
                Contact Provider
              </Button>
              <Button size="lg" variant="outline">
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
