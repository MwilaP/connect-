import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProviderProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if provider profile exists
  const { data: profile } = await supabase.from("provider_profiles").select("*").eq("user_id", user.id).single()

  if (!profile) {
    redirect("/provider/profile/new")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/provider/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/browse">Browse</Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" type="submit">
                Sign Out
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Provider Profile</h1>
          <Button asChild>
            <Link href="/provider/profile/edit">Edit Profile</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{profile.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <p className="text-lg">{profile.age} years old</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-lg">{profile.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                <p className="text-lg">${profile.hourly_rate}/hour</p>
              </div>
            </div>

            {profile.bio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bio</p>
                <p className="mt-2 text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {profile.images && profile.images.length > 0 && (
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
