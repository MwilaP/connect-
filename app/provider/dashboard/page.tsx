import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Eye, TrendingUp, Calendar } from "lucide-react"

export default async function ProviderDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get provider profile
  const { data: profile } = await supabase.from("provider_profiles").select("*").eq("user_id", user.id).maybeSingle()

  if (!profile) {
    redirect("/provider/profile/new")
  }

  // Get total views
  const { count: totalViews } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", profile.id)

  // Get views in last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { count: viewsLast7Days } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", profile.id)
    .gte("viewed_at", sevenDaysAgo.toISOString())

  // Get views in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: viewsLast30Days } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", profile.id)
    .gte("viewed_at", thirtyDaysAgo.toISOString())

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
            <Button variant="ghost" asChild>
              <Link href="/provider/profile">My Profile</Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" type="submit">
                Sign Out
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Track your profile performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">All time views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views (Last 7 Days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viewsLast7Days || 0}</div>
              <p className="text-xs text-muted-foreground">Recent activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views (Last 30 Days)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viewsLast30Days || 0}</div>
              <p className="text-xs text-muted-foreground">Monthly performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Quick overview of your provider profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-lg">{profile.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                <p className="text-lg">${profile.hourly_rate}/hr</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <p className="text-lg">{profile.age}</p>
              </div>
            </div>
            <div className="pt-4">
              <Button asChild>
                <Link href="/provider/profile/edit">Edit Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
