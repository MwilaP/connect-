import { useEffect, useState } from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { useSupabase } from "../../SupabaseContext"
import { useSubscription } from "../../hooks/useSubscription"
import { ProviderCard } from "../../../components/provider-card"
import { ProviderFilters } from "../../../components/provider-filters"
import { Button } from "../../../components/ui/button"
import { SubscriptionBanner } from "../../components/SubscriptionBanner"
import { PaymentModal } from "../../components/PaymentModal"
import type { ProviderProfile } from "../../../lib/types"
import type { User } from "@supabase/supabase-js"

export default function BrowseListPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const { subscriptionStatus, subscribe } = useSubscription()
  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasProviderProfile, setHasProviderProfile] = useState(false)
  const [hasClientProfile, setHasClientProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

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

      // Build query with filters
      let query = supabase
        .from("provider_profiles")
        .select(`
          *,
          services:provider_services(*)
        `)
        .order("created_at", { ascending: false })

      const location = searchParams.get("location")
      const minAge = searchParams.get("minAge")
      const maxAge = searchParams.get("maxAge")

      if (location) {
        query = query.ilike("location", `%${location}%`)
      }

      if (minAge) {
        query = query.gte("age", Number.parseInt(minAge))
      }

      if (maxAge) {
        query = query.lte("age", Number.parseInt(maxAge))
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching providers:", error)
      } else {
        setProviders(data || [])
      }
      
      setLoading(false)
    }

    fetchData()
  }, [searchParams, user])

  const handleSignOut = async () => {
    await signOut()
    navigate("/auth/login")
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                {userRole === "provider" && hasProviderProfile && (
                  <>
                    <Button variant="ghost" asChild>
                      <Link to="/provider/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to="/provider/profile">My Profile</Link>
                    </Button>
                  </>
                )}
                {userRole === "client" && hasClientProfile && (
                  <Button variant="ghost" asChild>
                    <Link to="/client/profile">My Profile</Link>
                  </Button>
                )}
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Providers</h1>
          <p className="mt-2 text-muted-foreground">Find the perfect service provider for your needs</p>
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
        <div className="mt-8">
          {providers && providers.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {providers.length} provider{providers.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No providers found</p>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters or check back later</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  )
}
