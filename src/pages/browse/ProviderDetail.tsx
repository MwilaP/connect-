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
import { MapPin, User, Lock, Phone, Crown, X, ChevronLeft, ChevronRight, ArrowLeft, Calendar, Briefcase, DollarSign, Star, Image as ImageIcon, Heart, Share2, MessageCircle, CheckCircle, Sparkles } from "lucide-react"
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

      // Check if user can view more profiles
      // Non-subscribed users can only view 3 unique providers per day
      // They can re-view providers they've already seen today
      if (user && !subscriptionStatus.hasActiveSubscription) {
        // If they haven't viewed this provider today and have reached the limit, block access
        if (!alreadyViewedToday && !subscriptionStatus.canViewMore) {
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
    <div className="min-h-screen bg-white dark:bg-background pb-16 sm:pb-0">
      {/* Airbnb-style Header */}
      <header className="border-b border-gray-200 dark:border-border bg-white dark:bg-card sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-gray-100 dark:hover:bg-muted rounded-full" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">C</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground hidden sm:block">
                ConnectPro
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-gray-100 dark:hover:bg-muted rounded-full hidden sm:flex" 
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-0 sm:px-6 lg:px-12 py-0 sm:py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-0 lg:gap-12">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
        {/* Hero Image Card */}
        <div className="relative h-[500px] sm:h-[550px] rounded-none sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-muted">
          {/* Image Carousel */}
          <div className="relative h-full w-full group">
            {provider.images && provider.images.length > 0 ? (
              <>
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => {
                    if (user && !subscriptionStatus.hasActiveSubscription && currentImageIndex > 0) {
                      setShowSubscriptionModal(true)
                    } else {
                      setSelectedImageIndex(currentImageIndex)
                    }
                  }}
                >
                  <img
                    src={provider.images[currentImageIndex] || "/placeholder.svg"}
                    alt={provider.name}
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                      user && !subscriptionStatus.hasActiveSubscription && currentImageIndex > 0 ? 'blur-lg scale-105' : ''
                    }`}
                  />
                </div>
                {user && !subscriptionStatus.hasActiveSubscription && currentImageIndex > 0 && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 flex flex-col items-center justify-center text-white z-10 pointer-events-none"
                  >
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl max-w-sm mx-4 text-center">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Crown className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                      <p className="text-white/80 mb-6 text-sm">Subscribe to view all photos in full quality</p>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowSubscriptionModal(true)
                        }}
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg pointer-events-auto"
                      >
                        <Crown className="h-5 w-5 mr-2" />
                        Unlock Premium - K100/mo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center">
                <Avatar className="h-56 w-56 shadow-2xl ring-4 ring-background">
                  <AvatarFallback className="text-7xl bg-gradient-to-br from-primary/20 to-primary/10">
                    {provider.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Image Navigation Dots - Modern Style */}
            {provider.images && provider.images.length > 1 && (
              <div className="absolute top-6 left-0 right-0 flex gap-2 px-6 z-20 justify-center">
                {provider.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'bg-white w-8 shadow-lg'
                        : 'bg-white/50 w-2 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap Areas for Image Navigation */}
            {provider.images && provider.images.length > 1 && (
              <>
                <div
                  className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : provider.images!.length - 1)
                  }}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(prev => prev < provider.images!.length - 1 ? prev + 1 : 0)
                  }}
                />
                {/* Center tap area for full-screen view */}
                <div
                  className="absolute left-1/3 right-1/3 top-0 bottom-0 cursor-zoom-in z-20"
                  onClick={() => {
                    if (user && !subscriptionStatus.hasActiveSubscription && currentImageIndex > 0) {
                      setShowSubscriptionModal(true)
                    } else {
                      setSelectedImageIndex(currentImageIndex)
                    }
                  }}
                />
              </>
            )}

            {/* Gradient Overlay - Softer */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

            {/* Quick Info Badge */}
            <div className="absolute top-6 left-6 z-20">
              <div className="bg-white dark:bg-gray-900 rounded-full px-4 py-2 shadow-md flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Available</span>
              </div>
            </div>

            {/* Profile Name Overlay */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white z-20">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold drop-shadow-lg">{provider.name}</h1>
                {getProviderAge(provider) && (
                  <span className="text-xl sm:text-3xl font-semibold drop-shadow-lg">{getProviderAge(provider)}</span>
                )}
              </div>
              {provider.country && provider.city && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-white/95 drop-shadow-md">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-lg font-medium">{formatLocation(provider.country, provider.city, provider.area || undefined)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons - Below Image */}
        <div className="flex items-center gap-3 px-6 sm:px-0 mt-6">
          {hasContactAccess || subscriptionStatus.hasActiveSubscription ? (
            <Button
              size="lg"
              className="flex-1 h-12 rounded-lg bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-base font-semibold shadow-sm"
              onClick={() => {
                if (provider.contact_number) {
                  window.location.href = `tel:${provider.contact_number}`
                }
              }}
            >
              <Phone className="h-5 w-5 mr-2" />
              <span className="hidden xs:inline">Call Now</span>
              <span className="xs:hidden">Call</span>
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1 h-12 rounded-lg bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-base font-semibold shadow-sm"
              onClick={() => setShowContactUnlockModal(true)}
            >
              <Lock className="h-5 w-5 mr-2" />
              <span className="hidden xs:inline">Unlock Contact - K30</span>
              <span className="xs:hidden">Unlock - K30</span>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full hover:bg-gray-100 dark:hover:bg-muted border border-gray-300 dark:border-border"
          >
            <Heart className="h-5 w-5" />
          </Button>
        </div>

        {/* About Section */}
        {provider.bio && (
          <div className="mx-6 sm:mx-0 py-8 border-b border-gray-200 dark:border-border">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground mb-4">About {provider.name}</h2>
            <p className="text-gray-700 dark:text-muted-foreground leading-relaxed text-base">{provider.bio}</p>
          </div>
        )}

        {/* Services */}
        {provider.services && provider.services.length > 0 && (
          <div className="mx-6 sm:mx-0 py-8 border-b border-gray-200 dark:border-border">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground mb-6">Services Offered</h2>
            <div className="grid gap-4">
              {provider.services.map((service) => (
                <div key={service.id} className="p-6 rounded-xl border border-gray-200 dark:border-border hover:shadow-md transition-shadow bg-white dark:bg-card">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-foreground mb-2">{service.service_name}</h4>
                      {service.description && (
                        <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">{service.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-foreground">K{service.price}</div>
                        <div className="text-sm text-gray-500 dark:text-muted-foreground">per session</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Right Side */}
      <div className="lg:col-span-1 space-y-6 px-6 sm:px-0 pb-6 sm:pb-0">
        {/* Contact Card */}
        <div className="border border-gray-200 dark:border-border lg:sticky lg:top-24 rounded-xl p-6 shadow-sm bg-white dark:bg-card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-6">Contact Information</h3>
          <div className="space-y-4">
            {hasContactAccess || subscriptionStatus.hasActiveSubscription ? (
              <>
                <div className="p-5 bg-gray-50 dark:bg-muted/30 rounded-xl border border-gray-200 dark:border-border">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-muted-foreground mb-2 uppercase tracking-wide">Phone Number</p>
                    <p className="font-semibold text-xl text-gray-900 dark:text-foreground">{provider.contact_number || '+260 XXX XXX XXX'}</p>
                  </div>
                  <Button 
                    className="w-full bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 h-12 text-base font-semibold rounded-lg shadow-sm"
                    size="lg"
                    onClick={() => {
                      if (provider.contact_number) {
                        window.location.href = `tel:${provider.contact_number}`
                      }
                    }}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call Now
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Contact unlocked</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 bg-gray-50 dark:bg-muted/30 rounded-xl border border-gray-200 dark:border-border">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-5 w-5 text-gray-400 dark:text-muted-foreground" />
                      <p className="font-semibold text-base text-gray-900 dark:text-foreground">Contact Locked</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">Unlock to get direct access to the phone number</p>
                  </div>
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-gray-900 dark:text-primary flex-shrink-0" />
                      <span>Direct phone access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-gray-900 dark:text-primary flex-shrink-0" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-gray-900 dark:text-primary flex-shrink-0" />
                      <span>Instant unlock</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowContactUnlockModal(true)}
                  className="w-full h-12 text-base font-semibold bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 rounded-lg shadow-sm"
                  size="lg"
                >
                  <Lock className="h-5 w-5 mr-2" />
                  Unlock for K30
                </Button>
                <p className="text-xs text-center text-gray-500 dark:text-muted-foreground mt-3">
                  Secure payment • Instant access
                </p>
              </>
            )}
          </div>
        </div>

        {/* Premium Subscription Card */}
        {user && !subscriptionStatus.hasActiveSubscription && (
          <div className="border border-gray-200 dark:border-border bg-white dark:bg-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground">Go Premium</h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Unlock all features</p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-foreground">Unlimited Access</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground">View unlimited profiles daily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ImageIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-foreground">Full Photo Access</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground">See all photos in HD quality</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-foreground">Priority Support</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground">Get help when you need it</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-border pt-4">
              <div className="flex items-baseline justify-center mb-4">
                <span className="text-3xl font-semibold text-gray-900 dark:text-foreground">K100</span>
                <span className="text-base text-gray-600 dark:text-muted-foreground ml-1">/month</span>
              </div>
              <Button 
                onClick={() => setShowSubscriptionModal(true)}
                className="w-full h-12 bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-base font-semibold rounded-lg shadow-sm"
                size="lg"
              >
                <Crown className="h-5 w-5 mr-2" />
                Subscribe Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
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
