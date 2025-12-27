import { useEffect, useState, useRef } from "react"
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { useSupabase } from "../../contexts/SupabaseContext"
import { useSubscription } from "../../hooks/useSubscription"
import { ProviderCard } from "../../../components/provider-card"
import { ProviderFilters } from "../../../components/provider-filters"
import { Button } from "../../../components/ui/button"
import { SubscriptionBanner } from "../../components/SubscriptionBanner"
import { PaymentModal } from "../../components/PaymentModal"
import { PageLoader } from "../../components/PageLoader"
import { BottomNav } from "../../components/BottomNav"
import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "../../../components/ui/input"
import type { ProviderProfile } from "../../../lib/types"
import type { User } from "@supabase/supabase-js"

// Cache for providers to prevent refetching when navigating back
let cachedProviders: ProviderProfile[] | null = null
let cachedSearchParams: string | null = null
let cachedScrollPosition: number = 0

export default function BrowseListPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useSupabase()
  const { subscriptionStatus, subscribe } = useSubscription()
  const [providers, setProviders] = useState<ProviderProfile[]>(cachedProviders || [])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasProviderProfile, setHasProviderProfile] = useState(false)
  const [hasClientProfile, setHasClientProfile] = useState(false)
  const [loading, setLoading] = useState(!cachedProviders)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const isInitialMount = useRef(true)

  // Restore scroll position when returning from detail page
  useEffect(() => {
    if (cachedProviders && cachedScrollPosition > 0) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        window.scrollTo(0, cachedScrollPosition)
      }, 0)
    }
  }, [])

  // Save scroll position before unmounting
  useEffect(() => {
    return () => {
      cachedScrollPosition = window.scrollY
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      if (user) {
        setUserRole(user.user_metadata?.role)
        
        // Check profiles
        const { data: providerProfile } = await supabase
          .from("provider_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        const { data: clientProfile } = await supabase
          .from("client_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        setHasProviderProfile(!!providerProfile)
        setHasClientProfile(!!clientProfile)
      }

      // Check if we're returning from a detail page with cached data
      const currentSearchParams = searchParams.toString()
      if (cachedProviders && cachedSearchParams === currentSearchParams && isInitialMount.current) {
        setProviders(cachedProviders)
        setLoading(false)
        isInitialMount.current = false
        return
      }

      // Build query with filters
      let query = supabase
        .from("provider_profiles")
        .select(`
          *,
          services:provider_services(*)
        `)
        .order("created_at", { ascending: false })

      const country = searchParams.get("country")
      const city = searchParams.get("city")
      const area = searchParams.get("area")

      if (country) {
        query = query.eq("country", country)
      }

      if (city) {
        query = query.eq("city", city)
      }

      if (area) {
        query = query.eq("area", area)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching providers:", error)
      } else {
        setProviders(data || [])
        // Cache the results
        cachedProviders = data || []
        cachedSearchParams = currentSearchParams
      }
      
      setLoading(false)
      isInitialMount.current = false
    }

    fetchData()
  }, [searchParams, user])

  const handleSignOut = async () => {
    await signOut()
    navigate("/auth/login")
  }

  const filteredProviders = providers.filter(provider => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      provider.name?.toLowerCase().includes(query) ||
      provider.bio?.toLowerCase().includes(query) ||
      provider.city?.toLowerCase().includes(query) ||
      provider.area?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-white dark:bg-background pb-20 sm:pb-0">
      {/* Airbnb-style Header */}
      <header className="bg-white dark:bg-card border-b border-gray-200 dark:border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex h-20 items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">C</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                ConnectPro
              </h1>
            </Link>
            
            {/* Desktop Navigation Only */}
            <nav className="hidden sm:flex items-center gap-3">
              {user ? (
                <>
                  {userRole === "provider" && hasProviderProfile && (
                    <>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-muted rounded-lg" asChild>
                        <Link to="/provider/dashboard">Dashboard</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-muted rounded-lg" asChild>
                        <Link to="/provider/profile">Profile</Link>
                      </Button>
                    </>
                  )}
                  {userRole === "client" && hasClientProfile && (
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-muted rounded-lg" asChild>
                      <Link to="/client/profile">Profile</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-muted rounded-lg" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-muted rounded-lg" asChild>
                    <Link to="/auth/login">Login</Link>
                  </Button>
                  <Button size="sm" className="bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 rounded-lg" asChild>
                    <Link to="/auth/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="px-6 pb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 rounded-full border border-gray-300 dark:border-border bg-white dark:bg-background hover:border-gray-400 dark:hover:border-border focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-primary focus-visible:border-gray-900 dark:focus-visible:border-primary transition-all shadow-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-muted"
                onClick={() => setShowFilterModal(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Subscription Banner for non-subscribed clients */}
        {user && userRole === "client" && !subscriptionStatus.hasActiveSubscription && (
          <div className="px-6 pt-8">
            <SubscriptionBanner
              viewsRemaining={subscriptionStatus.dailyViewsLimit - subscriptionStatus.dailyViewsCount}
              viewsLimit={subscriptionStatus.dailyViewsLimit}
              onUpgrade={() => setShowPaymentModal(true)}
            />
          </div>
        )}

        {/* Results */}
        <div className="px-6 py-8">
          {loading ? (
            <PageLoader message="Loading providers..." variant="skeleton" />
          ) : filteredProviders && filteredProviders.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                  {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'} available
                </h2>
              </div>
              <div className="space-y-6">
                {filteredProviders.map((provider) => (
                  <ProviderCard 
                    key={provider.id} 
                    provider={provider}
                    blurred={!!(user && userRole === "client" && !subscriptionStatus.hasActiveSubscription)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-muted/30 flex items-center justify-center mb-6">
                <Search className="h-12 w-12 text-gray-400 dark:text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-3">No providers found</h3>
              <p className="text-base text-gray-600 dark:text-muted-foreground max-w-md leading-relaxed">
                {searchQuery ? 'Try a different search term or adjust your filters' : 'Try adjusting your filters or check back later for new providers'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Location Filter Modal */}
      <ProviderFilters 
        open={showFilterModal} 
        onOpenChange={setShowFilterModal}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={100}
        purpose="subscription"
        onSuccess={async (paymentMethod) => {
          const success = await subscribe(paymentMethod);
          if (success) {
            setShowPaymentModal(false);
          }
          return success;
        }}
      />
      
      {/* Bottom Navigation for Mobile */}
      {user && (
        <BottomNav
          userRole={userRole}
          hasProviderProfile={hasProviderProfile}
          hasClientProfile={hasClientProfile}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  )
}
