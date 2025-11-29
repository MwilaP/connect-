import { Button } from "../../components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { createClient } from "../../lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Search, Shield, Star } from "lucide-react"
import { useSupabase } from "../contexts/SupabaseContext"
import { BottomNav } from "../components/BottomNav"

interface HomeProps {
  user: User | null
}

export default function Home({ user }: HomeProps) {
  const navigate = useNavigate()
  const supabase = createClient()
  const { signOut } = useSupabase()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasProviderProfile, setHasProviderProfile] = useState(false)
  const [hasClientProfile, setHasClientProfile] = useState(false)

  useEffect(() => {
    async function checkUserProfile() {
      if (!user) return

      const role = user.user_metadata?.role
      setUserRole(role)

      if (role === "provider") {
        const { data: providerProfile } = await supabase
          .from("provider_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        setHasProviderProfile(!!providerProfile)
        if (providerProfile) {
          navigate("/provider/dashboard")
        } else {
          navigate("/provider/profile/new")
        }
      } else if (role === "client") {
        const { data: clientProfile } = await supabase
          .from("client_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        setHasClientProfile(!!clientProfile)
        if (clientProfile) {
          navigate("/browse")
        } else {
          navigate("/client/profile/new")
        }
      } else {
        navigate("/browse")
      }
    }

    checkUserProfile()
  }, [user, navigate, supabase])

  const handleSignOut = async () => {
    await signOut()
    navigate("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 sm:pb-0">
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
                <Button variant="ghost" size="default" className="touch-target" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button size="default" className="touch-target" asChild>
                  <Link to="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero Section - Mobile-first design */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 sm:px-6 py-16 sm:py-24 md:py-32 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/50 backdrop-blur px-4 py-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-primary" />
              <span>Trusted by thousands of users</span>
            </div>
            
            <h2 className="text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Connect with Professional
              <span className="block text-primary mt-2">Service Providers</span>
            </h2>
            
            <p className="text-pretty max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed px-4">
              Browse verified providers, compare rates, and find the perfect match for your needs. Join our trusted
              marketplace today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
              <Button size="lg" className="touch-target w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14" asChild>
                <Link to="/auth/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="touch-target w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14" asChild>
                <Link to="/browse">Browse Providers</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section - Mobile-optimized cards */}
        <section className="border-t bg-muted/30 py-12 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">How It Works</h3>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                Get started in three simple steps
              </p>
            </div>
            
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="flex flex-col items-center gap-4 sm:gap-5 text-center p-6 sm:p-8 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/10">
                  <Search className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg sm:text-xl font-semibold">Create Your Account</h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Sign up as a client to browse providers or as a provider to offer your services
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4 sm:gap-5 text-center p-6 sm:p-8 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/10">
                  <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg sm:text-xl font-semibold">Browse & Filter</h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Search providers by location, price range, and other criteria to find your perfect match
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-4 sm:gap-5 text-center p-6 sm:p-8 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-4 ring-primary/10">
                  <Star className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg sm:text-xl font-semibold">Connect & Hire</h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    View detailed profiles with photos and reviews, then connect with your chosen provider
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Mobile-friendly */}
        <section className="py-12 sm:py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div className="space-y-2">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold">1000+</p>
                <p className="text-sm sm:text-base text-primary-foreground/80">Active Providers</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold">5000+</p>
                <p className="text-sm sm:text-base text-primary-foreground/80">Happy Clients</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold">50+</p>
                <p className="text-sm sm:text-base text-primary-foreground/80">Service Categories</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold">4.8</p>
                <p className="text-sm sm:text-base text-primary-foreground/80">Average Rating</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile-optimized footer */}
      <footer className="border-t bg-muted/30 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">C</span>
              </div>
              <span className="text-lg font-bold">ConnectPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ConnectPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
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
