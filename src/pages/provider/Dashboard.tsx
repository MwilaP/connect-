import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Eye, TrendingUp, Calendar } from "lucide-react"
import { useSupabase } from "../../SupabaseContext"
import type { User } from "@supabase/supabase-js"
import type { ProviderProfile } from "../../../lib/types"

export default function ProviderDashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [totalViews, setTotalViews] = useState(0)
  const [viewsLast7Days, setViewsLast7Days] = useState(0)
  const [viewsLast30Days, setViewsLast30Days] = useState(0)
  const [dashboardLoading, setDashboardLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Get provider profile
      const { data: profileData } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (!profileData) {
        navigate("/provider/profile/new")
        return
      }
      
      setProfile(profileData)
      
      // Get total views
      const { count: totalViewsCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", profileData.id)
      
      setTotalViews(totalViewsCount || 0)
      
      // Get views in last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: viewsLast7DaysCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", profileData.id)
        .gte("viewed_at", sevenDaysAgo.toISOString())
      
      setViewsLast7Days(viewsLast7DaysCount || 0)
      
      // Get views in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: viewsLast30DaysCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", profileData.id)
        .gte("viewed_at", thirtyDaysAgo.toISOString())
      
      setViewsLast30Days(viewsLast30DaysCount || 0)
      setDashboardLoading(false)
    }
    
    if (user) {
      fetchData()
    }
  }, [navigate, user])
  
  const handleSignOut = async () => {
    await signOut()
    navigate("/auth/login")
  }

  if (dashboardLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/provider/profile">My Profile</Link>
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
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
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">All time views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views (Last 7 Days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viewsLast7Days}</div>
              <p className="text-xs text-muted-foreground">Recent activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views (Last 30 Days)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viewsLast30Days}</div>
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
                <p className="text-lg">{profile?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-lg">{profile?.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                <p className="text-lg">${profile?.hourly_rate}/hr</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <p className="text-lg">{profile?.age}</p>
              </div>
            </div>
            <div className="pt-4">
              <Button asChild>
                <Link to="/provider/profile/edit">Edit Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
