import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { useSupabase } from "../../SupabaseContext"
import { useSubscription } from "../../hooks/useSubscription"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { PaymentModal } from "../../components/PaymentModal"
import { AccessRestrictionModal } from "../../components/AccessRestrictionModal"
import { MapPin, User, Lock, Phone, Crown } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import type { ProviderProfile } from "../../../lib/types"
import { getProviderAge } from "../../../lib/age-utils"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useSupabase()
  const { subscriptionStatus, trackProfileView, checkContactUnlock, unlockContact, subscribe } = useSubscription()
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasContactAccess, setHasContactAccess] = useState(false)
  const [showAccessRestriction, setShowAccessRestriction] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showContactUnlockModal, setShowContactUnlockModal] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError("Provider ID not found")
        setLoading(false)
        return
      }

      const supabase = createClient()

      // For logged-in users, check if they've already viewed this profile today
      let alreadyViewedToday = false;
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        const { data: existingView } = await supabase
          .from('profile_views_tracking')
          .select('*')
          .eq('client_id', user.id)
          .eq('provider_id', id)
          .eq('view_date', today)
          .maybeSingle();
        
        alreadyViewedToday = !!existingView;
      }

      // Check if user can view more profiles (only if they haven't viewed this one today)
      if (user && !subscriptionStatus.hasActiveSubscription && !alreadyViewedToday) {
        // Check if they've reached the limit
        if (!subscriptionStatus.canViewMore) {
          setShowAccessRestriction(true)
          setLoading(false)
          return
        }
      }

      // Get provider profile
      const { data: providerData, error: providerError } = await supabase
        .from("provider_profiles")
        .select(`
          *,
          services:provider_services(*)
        `)
        .eq("id", id)
        .single()

      if (providerError || !providerData) {
        setError("Provider not found")
        setLoading(false)
        return
      }

      setProvider(providerData)

      // Track profile view if user is logged in and hasn't viewed today
      if (user && !alreadyViewedToday) {
        await trackProfileView(id)
      }
      
      // Check if contact is already unlocked
      if (user) {
        const hasAccess = await checkContactUnlock(id)
        setHasContactAccess(hasAccess)
      }

      setLoading(false)
    }

    fetchData()
  }, [id, user])

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
              {getProviderAge(provider) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-5 w-5" />
                  <span>{getProviderAge(provider)} years old</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{provider.location}</span>
              </div>
            </div>

            {/* Services */}
            {provider.services && provider.services.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">Services Offered</h3>
                <div className="space-y-3">
                  {provider.services.map((service) => (
                    <div key={service.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.service_name}</h4>
                          {service.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          K{service.price}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <div key={index} className="aspect-video overflow-hidden rounded-lg border relative">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${provider.name} photo ${index + 1}`}
                        className={`h-full w-full object-cover transition-all ${
                          user && !subscriptionStatus.hasActiveSubscription ? 'blur-sm scale-105' : ''
                        }`}
                      />
                      {user && !subscriptionStatus.hasActiveSubscription && (
                        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white p-4">
                          <Lock className="h-8 w-8 mb-2" />
                          <p className="text-sm font-medium text-center">Subscribe to unlock full photos</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Subscription CTA if not subscribed */}
                {user && !subscriptionStatus.hasActiveSubscription && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <Crown className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Unlock Full Access</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Subscribe for K100/month to view all photos unblurred and get unlimited profile access
                        </p>
                        <Button 
                          onClick={() => setShowSubscriptionModal(true)}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          Subscribe Now
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contact Section */}
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
              
              {hasContactAccess || subscriptionStatus.hasActiveSubscription ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="font-medium">{provider.contact_number || '+260 XXX XXX XXX'}</span>
                  </div>
                  <p className="text-sm text-green-600">
                    ✓ Contact information unlocked
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Unlock this provider's contact number to get in touch directly
                  </p>
                  <Button 
                    onClick={() => setShowContactUnlockModal(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Unlock Contact (K30)
                  </Button>
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    One-time payment for this provider only
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Restriction Modal */}
      <AccessRestrictionModal
        isOpen={showAccessRestriction}
        onClose={() => {
          setShowAccessRestriction(false)
          navigate('/browse')
        }}
        onSubscribe={() => {
          setShowAccessRestriction(false)
          setShowSubscriptionModal(true)
        }}
        viewsRemaining={subscriptionStatus.dailyViewsLimit - subscriptionStatus.dailyViewsCount}
        viewsLimit={subscriptionStatus.dailyViewsLimit}
      />

      {/* Subscription Payment Modal */}
      <PaymentModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        amount={100}
        purpose="subscription"
        onSuccess={async (paymentMethod) => {
          const success = await subscribe(paymentMethod)
          if (success) {
            setShowSubscriptionModal(false)
          }
          return success
        }}
      />

      {/* Contact Unlock Payment Modal */}
      <PaymentModal
        isOpen={showContactUnlockModal}
        onClose={() => setShowContactUnlockModal(false)}
        amount={30}
        purpose="contact_unlock"
        providerName={provider?.name}
        onSuccess={async (paymentMethod) => {
          if (!id) return false
          const success = await unlockContact(id)
          if (success) {
            setHasContactAccess(true)
            setShowContactUnlockModal(false)
          }
          return success
        }}
      />
    </div>
  )
}
