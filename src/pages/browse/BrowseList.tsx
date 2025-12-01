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

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      {/* Simplified Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex h-14 sm:h-20 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg sm:text-xl font-bold text-primary-foreground">C</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ConnectPro
            </h1>
          </Link>
          
          {/* Desktop Navigation Only */}
          <nav className="hidden sm:flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {userRole === "provider" && hasProviderProfile && (
                  <>
                    <Button variant="ghost" size="sm" className="touch-target" asChild>
                      <Link to="/provider/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="touch-target" asChild>
                      <Link to="/provider/profile">Profile</Link>
                    </Button>
                  </>
                )}
                {userRole === "client" && hasClientProfile && (
                  <Button variant="ghost" size="sm" className="touch-target" asChild>
                    <Link to="/client/profile">Profile</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="touch-target" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="touch-target" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button size="sm" className="touch-target" asChild>
                  <Link to="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Browse Providers</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">Find the perfect service provider for your needs</p>
        </div>

        {/* Subscription Banner for non-subscribed clients */}
        {user && userRole === "client" && !subscriptionStatus.hasActiveSubscription && (
          <SubscriptionBanner
            viewsRemaining={subscriptionStatus.dailyViewsLimit - subscriptionStatus.dailyViewsCount}
            viewsLimit={subscriptionStatus.dailyViewsLimit}
            onUpgrade={() => setShowPaymentModal(true)}
          />
        )}

        {/* Filters */}
        <ProviderFilters />

        {/* Results */}
        <div className="mt-6 sm:mt-8">
          {loading ? (
            <PageLoader message="Loading providers..." variant="skeleton" />
          ) : providers && providers.length > 0 ? (
            <>
              <p className="mb-4 sm:mb-6 text-sm sm:text-base text-muted-foreground font-medium">
                {providers.length} provider{providers.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((provider) => (
                  <ProviderCard 
                    key={provider.id} 
                    provider={provider}
                    blurred={!!(user && userRole === "client" && !subscriptionStatus.hasActiveSubscription)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-3xl sm:text-4xl">🔍</span>
              </div>
              <p className="text-lg sm:text-xl font-semibold mb-2">No providers found</p>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md">Try adjusting your filters or check back later for new providers</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={5}
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
