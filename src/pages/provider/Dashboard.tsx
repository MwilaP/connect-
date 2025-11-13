import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Eye, TrendingUp, Calendar, User as UserIcon, Clock, X, Menu } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { useSupabase } from "../../contexts/SupabaseContext"
import { getProviderAge } from "../../../lib/age-utils"
import { formatLocation } from "../../../lib/location-data"
import type { User } from "@supabase/supabase-js"
import type { ProviderProfile } from "../../../lib/types"

export default function ProviderDashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [totalViews, setTotalViews] = useState(0)
  const [viewsLast7Days, setViewsLast7Days] = useState(0)
  const [viewsLast30Days, setViewsLast30Days] = useState(0)
  const [recentViews, setRecentViews] = useState<any[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [showSevenDayModal, setShowSevenDayModal] = useState(false)
  const [sevenDayViews, setSevenDayViews] = useState<any[]>([])
  const [loadingSevenDayViews, setLoadingSevenDayViews] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        .select(`
          *,
          services:provider_services(*)
        `)
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (!profileData) {
        navigate("/provider/profile/new")
        return
      }
      
      setProfile(profileData)
      
      // Get total views
      const { count: totalViewsCount } = await supabase
        .from("profile_views_tracking")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", profileData.id)
      
      setTotalViews(totalViewsCount || 0)
      
      // Get views in last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: viewsLast7DaysCount } = await supabase
        .from("profile_views_tracking")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", profileData.id)
        .gte("viewed_at", sevenDaysAgo.toISOString())
      
      setViewsLast7Days(viewsLast7DaysCount || 0)
      
      // Get views in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: viewsLast30DaysCount } = await supabase
        .from("profile_views_tracking")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", profileData.id)
        .gte("viewed_at", thirtyDaysAgo.toISOString())
      
      setViewsLast30Days(viewsLast30DaysCount || 0)
      
      // Get recent profile views
      const { data: viewsData } = await supabase
        .from("profile_views_tracking")
        .select("id, viewed_at, client_id")
        .eq("provider_id", profileData.id)
        .order("viewed_at", { ascending: false })
        .limit(10)
      
      // Get client profiles for the viewers
      const views = viewsData || []
      if (views.length > 0) {
        const clientIds = views.map(v => v.client_id)
        const { data: clientProfiles } = await supabase
          .from("client_profiles")
          .select("user_id, name, location")
          .in("user_id", clientIds)
        
        // Merge client profiles with views
        views.forEach((view: any) => {
          view.client_profile = clientProfiles?.find(cp => cp.user_id === view.client_id)
        })
      }
      
      setRecentViews(views)
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

  const fetchSevenDayViews = async () => {
    if (!profile) return
    
    setLoadingSevenDayViews(true)
    setShowSevenDayModal(true)
    
    const supabase = createClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Get views from last 7 days
    const { data: viewsData } = await supabase
      .from("profile_views_tracking")
      .select("id, viewed_at, client_id")
      .eq("provider_id", profile.id)
      .gte("viewed_at", sevenDaysAgo.toISOString())
      .order("viewed_at", { ascending: false })
    
    // Get client profiles for the viewers
    const views = viewsData || []
    if (views.length > 0) {
      const clientIds = views.map(v => v.client_id)
      const { data: clientProfiles } = await supabase
        .from("client_profiles")
        .select("user_id, name, location")
        .in("user_id", clientIds)
      
      // Merge client profiles with views
      views.forEach((view: any) => {
        view.client_profile = clientProfiles?.find(cp => cp.user_id === view.client_id)
      })
    }
    
    setSevenDayViews(views)
    setLoadingSevenDayViews(false)
  }

  if (dashboardLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-lg sm:text-xl font-semibold">
            ConnectPro
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/browse">Browse</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/provider/profile">My Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/referrals">Referrals</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/browse">Browse</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/provider/profile">My Profile</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link to="/referrals">Referrals</Link>
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Provider Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">Track your profile performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
            onClick={fetchSevenDayViews}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views (Last 7 Days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viewsLast7Days}</div>
              <p className="text-xs text-muted-foreground">Click to see details</p>
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

        {/* Recent Profile Views */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Profile Views</CardTitle>
            <CardDescription>Latest visitors to your profile</CardDescription>
          </CardHeader>
          <CardContent>
            {recentViews.length > 0 ? (
              <div className="space-y-3">
                {recentViews.map((view: any) => (
                  <div key={view.id} className="flex items-start sm:items-center justify-between border-b pb-3 last:border-0 gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {view.client_profile?.name || "Anonymous Viewer"}
                        </p>
                        {view.client_profile?.location && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {view.client_profile.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                      <span className="whitespace-nowrap">{new Date(view.viewed_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No profile views yet. Share your profile to get more visibility!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Quick overview of your provider profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-lg">{profile?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-lg">
                  {profile?.country && profile?.city
                    ? formatLocation(profile.country, profile.city, profile.area || undefined)
                    : profile?.location || "Not specified"}
                </p>
              </div>
              {profile && getProviderAge(profile) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Age</p>
                  <p className="text-lg">{getProviderAge(profile)} years</p>
                </div>
              )}
              {profile?.contact_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                  <p className="text-lg">{profile.contact_number}</p>
                </div>
              )}
            </div>
            {profile?.services && profile.services.length > 0 && (
              <div className="pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Services Offered</p>
                <div className="flex flex-wrap gap-2">
                  {profile.services.map((service) => (
                    <Badge key={service.id} variant="secondary">
                      {service.service_name} - K{service.price}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4">
              <Button asChild>
                <Link to="/provider/profile/edit">Edit Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Views Modal */}
      <Dialog open={showSevenDayModal} onOpenChange={setShowSevenDayModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile Views - Last 7 Days</DialogTitle>
            <DialogDescription>
              Detailed list of clients who viewed your profile in the last 7 days
            </DialogDescription>
          </DialogHeader>
          
          {loadingSevenDayViews ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading views...</p>
            </div>
          ) : sevenDayViews.length > 0 ? (
            <div className="space-y-3 mt-4">
              {sevenDayViews.map((view: any) => (
                <div key={view.id} className="flex items-start sm:items-center justify-between border-b pb-3 last:border-0 gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {view.client_profile?.name || "Anonymous Viewer"}
                      </p>
                      {view.client_profile?.location && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {view.client_profile.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 sm:gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="whitespace-nowrap">{new Date(view.viewed_at).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(view.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-muted-foreground">
                No profile views in the last 7 days
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
