import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { useSupabase } from "../../contexts/SupabaseContext"
import { useSubscription } from "../../hooks/useSubscription"
import { PageLoader } from "../../components/PageLoader"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { PaymentModal } from "../../components/PaymentModal"
import { AccessRestrictionModal } from "../../components/AccessRestrictionModal"
import { MapPin, User, Lock, Phone, Crown, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import type { ProviderProfile } from "../../../lib/types"
import { getProviderAge } from "../../../lib/age-utils"
import { formatLocation } from "../../../lib/location-data"
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

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

  // Keyboard navigation for image modal
  useEffect(() => {
    if (selectedImageIndex === null || !provider?.images) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1)
      } else if (e.key === 'ArrowRight' && selectedImageIndex < provider.images.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1)
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageIndex, provider?.images])

  // Swipe gesture handlers
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !provider?.images) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && selectedImageIndex !== null && selectedImageIndex < provider.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
    if (isRightSwipe && selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate("/auth/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <header className="border-b bg-background sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="text-xl font-semibold">
              ConnectPro
            </Link>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/browse">Back to Browse</Link>
              </Button>
            </nav>
          </div>
        </header>
        <div className="container mx-auto py-8 px-4">
          <PageLoader message="Loading provider details..." />
        </div>
      </div>
    );
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
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/browse">Back to Browse</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section with Profile Image */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
            <div className="grid md:grid-cols-2 gap-6 p-8">
              {/* Profile Info */}
              <div className="flex flex-col justify-center space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{provider.name}</h1>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    {getProviderAge(provider) && (
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <span className="text-lg">{getProviderAge(provider)} years old</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      <span className="text-lg">
                        {provider.country && provider.city
                          ? formatLocation(provider.country, provider.city, provider.area || undefined)
                          : provider.location || "Location not specified"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Bio Preview */}
                {provider.bio && (
                  <p className="text-muted-foreground leading-relaxed line-clamp-3">
                    {provider.bio}
                  </p>
                )}
              </div>
              
              {/* Featured Image */}
              {provider.images && provider.images.length > 0 && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-background shadow-lg">
                  <img
                    src={provider.images[0] || "/placeholder.svg"}
                    alt={provider.name}
                    className={`h-full w-full object-cover transition-all cursor-pointer hover:scale-105 ${
                      user && !subscriptionStatus.hasActiveSubscription ? 'blur-sm' : ''
                    }`}
                    onClick={() => user && subscriptionStatus.hasActiveSubscription && setSelectedImageIndex(0)}
                  />
                  {user && !subscriptionStatus.hasActiveSubscription && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4">
                      <Lock className="h-10 w-10 mb-2" />
                      <p className="text-sm font-medium text-center">Subscribe to unlock</p>
                    </div>
                  )}
                  {user && subscriptionStatus.hasActiveSubscription && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      Click to view full size
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Services */}
            {provider.services && provider.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Services Offered</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {provider.services.map((service) => (
                    <div key={service.id} className="rounded-lg border bg-card hover:bg-accent/50 transition-colors p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{service.service_name}</h4>
                          {service.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
                          K{service.price}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Full Bio */}
            {provider.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{provider.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Photo Gallery */}
            {provider.images && provider.images.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Photo Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {provider.images.slice(1).map((image: string, index: number) => (
                      <div 
                        key={index + 1} 
                        className="aspect-square overflow-hidden rounded-lg border relative group cursor-pointer"
                        onClick={() => user && subscriptionStatus.hasActiveSubscription && setSelectedImageIndex(index + 1)}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`${provider.name} photo ${index + 2}`}
                          className={`h-full w-full object-cover transition-all group-hover:scale-110 ${
                            user && !subscriptionStatus.hasActiveSubscription ? 'blur-md' : ''
                          }`}
                        />
                        {user && !subscriptionStatus.hasActiveSubscription && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                            <Lock className="h-6 w-6 mb-1" />
                            <p className="text-xs font-medium">Subscribe</p>
                          </div>
                        )}
                        {user && subscriptionStatus.hasActiveSubscription && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/90 text-xs px-2 py-1 rounded">
                              View full size
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Contact Section */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                {hasContactAccess || subscriptionStatus.hasActiveSubscription ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <Phone className="h-6 w-6 text-primary" />
                      <span className="font-semibold text-lg">{provider.contact_number || '+260 XXX XXX XXX'}</span>
                    </div>
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <span className="text-lg">✓</span> Contact information unlocked
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
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
                    <p className="text-xs text-center text-muted-foreground">
                      One-time payment for this provider only
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription CTA if not subscribed */}
            {user && !subscriptionStatus.hasActiveSubscription && (
              <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Crown className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">Unlock Full Access</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Subscribe for K100/month to view all photos unblurred and get unlimited profile access
                      </p>
                      <Button 
                        onClick={() => setShowSubscriptionModal(true)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Subscribe Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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

      {/* Image Modal */}
      {selectedImageIndex !== null && provider.images && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Previous Button */}
          {selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImageIndex(selectedImageIndex - 1)
              }}
              className="absolute left-4 text-white hover:bg-white/10 rounded-full p-3 transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          
          {/* Next Button */}
          {selectedImageIndex < provider.images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImageIndex(selectedImageIndex + 1)
              }}
              className="absolute right-4 text-white hover:bg-white/10 rounded-full p-3 transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
          
          {/* Image */}
          <div className="relative max-w-7xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={provider.images[selectedImageIndex]}
              alt={`${provider.name} photo ${selectedImageIndex + 1}`}
              className="w-full h-full object-contain rounded-lg select-none"
              draggable={false}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} / {provider.images.length}
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              Swipe or use arrow keys to navigate
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
