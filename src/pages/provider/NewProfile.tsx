import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../../../lib/supabase/client"
import { ProviderProfileForm } from "../../../components/provider-profile-form"
import { useSupabase } from "../../contexts/SupabaseContext"
import type { User } from "@supabase/supabase-js"
import { Briefcase, CheckCircle2 } from "lucide-react"

export default function NewProviderProfilePage() {
  const navigate = useNavigate()
  const { user } = useSupabase()
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileExists, setProfileExists] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        navigate("/auth/login")
        return
      }
      
      const supabase = createClient()
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("provider_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
      
      if (existingProfile) {
        navigate("/provider/profile/edit")
        return
      }
      
      setProfileLoading(false)
    }
    
    if (user) {
      fetchData()
    }
  }, [navigate, user])

  if (profileLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Header Skeleton */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 animate-pulse" />
              <div className="h-6 w-32 bg-primary/20 rounded animate-pulse" />
            </div>
          </div>
        </header>

        {/* Hero Skeleton */}
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 animate-pulse" />
              <div className="h-10 w-96 bg-muted rounded mx-auto animate-pulse" />
              <div className="h-6 w-full max-w-2xl bg-muted/60 rounded mx-auto animate-pulse" />
              
              {/* Progress Steps Skeleton */}
              <div className="flex items-center justify-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="w-12 h-0.5 bg-border"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse" />
                  <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
                </div>
                <div className="w-12 h-0.5 bg-border"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted/40 animate-pulse" />
                  <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Skeleton */}
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-8">
            {/* Card Skeleton */}
            <div className="border rounded-lg shadow-lg bg-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
                <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
                <div className="h-11 w-full bg-muted/40 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="fixed bottom-8 right-8 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-3 z-50">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Preparing form...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-lg font-semibold">ConnectPro</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Create Your Provider Profile</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our marketplace and start connecting with clients who need your services
            </p>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  currentStep >= 1 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border-2 border-border text-muted-foreground'
                }`}>
                  {currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                </div>
                <span className={`text-sm ${currentStep >= 1 ? 'font-medium' : 'text-muted-foreground'}`}>
                  Profile Info
                </span>
              </div>
              <div className={`w-12 h-0.5 transition-colors ${currentStep > 1 ? 'bg-primary' : 'bg-border'}`}></div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  currentStep >= 2 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border-2 border-border text-muted-foreground'
                }`}>
                  {currentStep > 2 ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                </div>
                <span className={`text-sm ${currentStep >= 2 ? 'font-medium' : 'text-muted-foreground'}`}>
                  Services
                </span>
              </div>
              <div className={`w-12 h-0.5 transition-colors ${currentStep > 2 ? 'bg-primary' : 'bg-border'}`}></div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  currentStep >= 3 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border-2 border-border text-muted-foreground'
                }`}>
                  3
                </div>
                <span className={`text-sm ${currentStep >= 3 ? 'font-medium' : 'text-muted-foreground'}`}>
                  Photos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <ProviderProfileForm userId={user.id} onStepChange={setCurrentStep} />
      </div>
    </div>
  )
}
