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
import { MapPin, User, Lock, Phone, Crown, X, ChevronLeft, ChevronRight, ArrowLeft, Calendar, Briefcase, DollarSign, Star, Image as ImageIcon } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import type { ProviderProfile } from "../../../lib/types"
import { getProviderAge } from "../../../lib/age-utils"
import { formatLocation } from "../../../lib/location-data"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { BottomNav } from "../../components/BottomNav"

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, signOut } = useSupabase()
  const { subscriptionStatus, trackProfileView, checkContactUnlock, unlockContact, subscribe } = useSubscription()
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasContactAccess, setHasContactAccess] = useState(false)
  const [showAccessRestriction, setShowAccessRestriction] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showContactUnlockModal, setShowContactUnlockModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasProviderProfile, setHasProviderProfile] = useState(false)
  const [hasClientProfile, setHasClientProfile] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

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
  }, [id, user, subscriptionStatus.hasActiveSubscription, subscriptionStatus.canViewMore])

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
    await signOut()
    navigate("/auth/login")
  }

  // Get user role and profile info
  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role
      setUserRole(role)
      if (role === 'provider') {
        setHasProviderProfile(true)
      } else if (role === 'client') {
        setHasClientProfile(true)
      }
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden sm:inline-flex" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
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
          <Button onClick={() => navigate(-1)} className="mt-4">
            Back to Browse
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      {/* Professional Header */}
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden sm:inline-flex touch-target" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-md px-0 sm:px-4 py-0 sm:py-6">
        {/* Tinder-Style Card */}
        <div className="relative h-[calc(100vh-7rem)] sm:h-[600px] sm:rounded-2xl overflow-hidden shadow-2xl">
          {/* Image Carousel */}
          <div className="relative h-full w-full">
            {provider.images && provider.images.length > 0 ? (
              <>
                <img
                  src={provider.images[currentImageIndex] || "/placeholder.svg"}
                  alt={provider.name}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                    user && !subscriptionStatus.hasActiveSubscription ? 'blur-md' : ''
                  }`}
                />
                {user && !subscriptionStatus.hasActiveSubscription && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
                    <Lock className="h-16 w-16 mb-4" />
                    <p className="text-lg font-semibold mb-2">Subscribe to Unlock</p>
                    <Button 
                      onClick={() => setShowSubscriptionModal(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Get Premium
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
                <Avatar className="h-48 w-48">
                  <AvatarFallback className="text-6xl bg-primary/10">
                    {provider.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Image Navigation Dots */}
            {provider.images && provider.images.length > 1 && (
              <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 z-20">
                {provider.images.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-white'
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap Areas for Image Navigation */}
            {provider.images && provider.images.length > 1 && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
                  onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : provider.images!.length - 1)}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
                  onClick={() => setCurrentImageIndex(prev => prev < provider.images!.length - 1 ? prev + 1 : 0)}
                />
              </>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
              <div className="flex items-end justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{provider.name}</h1>
                    {getProviderAge(provider) && (
                      <span className="text-2xl font-semibold">{getProviderAge(provider)}</span>
                    )}
                  </div>
                  {provider.country && provider.city && (
                    <div className="flex items-center gap-2 text-white/90 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{formatLocation(provider.country, provider.city, provider.area || undefined)}</span>
                    </div>
                  )}
                  {provider.bio && (
                    <p className="text-sm text-white/80 line-clamp-2">{provider.bio}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-2 border-white/40"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <User className="h-5 w-5 text-white" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-14 w-14 rounded-full bg-white hover:bg-white/90 shadow-lg"
                  onClick={() => navigate(-1)}
                >
                  <X className="h-6 w-6 text-red-500" />
                </Button>
                {hasContactAccess || subscriptionStatus.hasActiveSubscription ? (
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 shadow-lg"
                    onClick={() => {
                      if (provider.contact_number) {
                        window.location.href = `tel:${provider.contact_number}`
                      }
                    }}
                  >
                    <Phone className="h-7 w-7 text-white" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    onClick={() => setShowContactUnlockModal(true)}
                  >
                    <Lock className="h-6 w-6 text-white" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-14 w-14 rounded-full bg-white hover:bg-white/90 shadow-lg"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <User className="h-6 w-6 text-primary" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sheet - Slides up from bottom */}
        {showInfo && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowInfo(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">About {provider.name}</h2>
                <Button size="icon" variant="ghost" onClick={() => setShowInfo(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 space-y-6">

            {/* Services */}
            {provider.services && provider.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:gap-4">
                    {provider.services.map((service) => (
                      <Card key={service.id} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base sm:text-lg">{service.service_name}</h4>
                              {service.description && (
                                <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-base font-semibold px-3 py-1.5 flex items-center gap-1 flex-shrink-0">
                              <DollarSign className="h-3 w-3" />
                              K{service.price}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full Bio */}
            {provider.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <User className="h-5 w-5" />
                    About {provider.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{provider.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Photo Gallery */}
            {provider.images && provider.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photo Gallery ({provider.images.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {provider.images.map((image: string, index: number) => (
                      <div 
                        key={index} 
                        className="aspect-square overflow-hidden rounded-lg border-2 hover:border-primary/50 relative group cursor-pointer transition-all"
                        onClick={() => user && subscriptionStatus.hasActiveSubscription && setSelectedImageIndex(index)}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`${provider.name} photo ${index + 1}`}
                          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                            user && !subscriptionStatus.hasActiveSubscription ? 'blur-md' : ''
                          }`}
                        />
                        {user && !subscriptionStatus.hasActiveSubscription && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                            <Lock className="h-6 w-6 sm:h-8 sm:w-8 mb-1" />
                            <p className="text-xs sm:text-sm font-medium">Subscribe</p>
                          </div>
                        )}
                        {user && subscriptionStatus.hasActiveSubscription && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/90 text-xs px-2 py-1 rounded">
                              Click to view
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
                {/* Contact Section in Sheet */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </h3>
                  {hasContactAccess || subscriptionStatus.hasActiveSubscription ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">Phone Number</p>
                          <p className="font-semibold text-lg truncate">{provider.contact_number || '+260 XXX XXX XXX'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                        <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs">✓</span>
                        </div>
                        <span className="font-medium">Contact unlocked</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Contact Locked</p>
                            <p className="text-xs text-muted-foreground">K30 one-time unlock</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Unlock to get direct contact access to this provider
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          setShowInfo(false)
                          setShowContactUnlockModal(true)
                        }}
                        className="w-full"
                        size="lg"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Unlock Contact - K30
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        One-time payment • Valid forever
                      </p>
                    </div>
                  )}
                </div>

                {/* Subscription CTA in Sheet */}
                {user && !subscriptionStatus.hasActiveSubscription && (
                  <div className="p-6 border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-1">Premium Access</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Subscribe for K100/month to unlock all photos and get unlimited profile views
                        </p>
                        <ul className="space-y-2 mb-4 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                            <span>View all photos unblurred</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                            <span>Unlimited profile access</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                            <span>Priority support</span>
                          </li>
                        </ul>
                        <Button 
                          onClick={() => {
                            setShowInfo(false)
                            setShowSubscriptionModal(true)
                          }}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md"
                          size="lg"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Subscribe Now - K100/mo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation for Mobile */}
      {user && (
        <BottomNav
          userRole={userRole}
          hasProviderProfile={hasProviderProfile}
          hasClientProfile={hasClientProfile}
          onSignOut={handleSignOut}
        />
      )}

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
        providerId={id}
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
