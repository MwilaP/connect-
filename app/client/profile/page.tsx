import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ClientProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has a client profile
  const { data: profile } = await supabase.from("client_profiles").select("*").eq("user_id", user.id).maybeSingle()

  if (!profile) {
    redirect("/client/profile/new")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
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

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button asChild>
            <Link href="/client/profile/edit">Edit Profile</Link>
          </Button>
        </div>

        <div className="space-y-6 rounded-lg border bg-card p-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Name</h2>
            <p className="mt-1 text-lg">{profile.name}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Location</h2>
            <p className="mt-1 text-lg">{profile.location}</p>
          </div>

          {profile.bio && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Bio</h2>
              <p className="mt-1 text-lg">{profile.bio}</p>
            </div>
          )}

          {profile.preferences && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">Preferences</h2>
              <p className="mt-1 text-lg">{profile.preferences}</p>
            </div>
          )}

          <div className="pt-4 text-sm text-muted-foreground">
            <p>Profile created: {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
