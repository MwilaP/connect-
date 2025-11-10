import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MapPin, DollarSign, User } from "lucide-react"

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: provider, error } = await supabase.from("provider_profiles").select("*").eq("id", id).single()

  if (error || !provider) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Record the profile view (don't await to avoid blocking page render)
    supabase
      .from("profile_views")
      .insert({
        provider_id: provider.id,
        viewer_id: user.id,
      })
      .then(({ error: viewError }) => {
        if (viewError) {
          console.error("[v0] Error tracking profile view:", viewError)
        }
      })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/browse">Back to Browse</Link>
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
