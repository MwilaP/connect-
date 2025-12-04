import type React from "react"
import { createClient } from "../../../lib/supabase/client"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Gift, Users, Briefcase, Mail, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"client" | "provider">("client")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralValid, setReferralValid] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setReferralCode(refCode)
      validateReferralCode(refCode)
    }
  }, [searchParams])

  const validateReferralCode = async (code: string) => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('referral_code', code.toUpperCase())
        .single()

      setReferralValid(!!data && !error)
    } catch (err) {
      setReferralValid(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/browse`,
          // Disable email confirmation - user can login immediately
          emailConfirmation: false,
        },
      })

      if (error) throw error

      if (data.user) {
        // Initialize user (create referral code, etc.)
        try {
          await supabase.rpc('handle_new_user_signup', {
            p_user_id: data.user.id
          })
        } catch (initError) {
          console.error('Failed to initialize user:', initError)
          // Don't block signup if initialization fails
        }

        // Track referral if referral code was provided
        if (referralCode && referralValid) {
          try {
            await supabase.rpc('track_referral', {
              p_referred_user_id: data.user.id,
              p_referral_code: referralCode.toUpperCase(),
            })
          } catch (refError) {
            console.error('Failed to track referral:', refError)
            // Don't block signup if referral tracking fails
          }
        }
        
        // Redirect to profile creation based on role
        if (role === "provider") {
          navigate("/provider/profile/new")
        } else {
          navigate("/client/profile/new")
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Side - Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl font-bold text-white">C</span>
            </div>
            <h1 className="text-3xl font-bold text-white">
              ConnectPro
            </h1>
          </div>
          
          <div className="space-y-6 text-white">
            <h2 className="text-4xl font-bold leading-tight">
              Join the Future of<br />Professional Services
            </h2>
            <p className="text-xl text-white/90 max-w-md">
              Connect with top professionals or showcase your expertise to thousands of clients.
            </p>
          </div>
        </div>
        
        {/* Features */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Verified Professionals</h3>
              <p className="text-sm text-white/80">All providers are thoroughly vetted and verified</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Secure Payments</h3>
              <p className="text-sm text-white/80">Safe and encrypted payment processing</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">24/7 Support</h3>
              <p className="text-sm text-white/80">Our team is always here to help you succeed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">C</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ConnectPro
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Create your account</h2>
            <p className="text-muted-foreground">
              Get started with ConnectPro today
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            {/* Referral Alerts */}
            {referralCode && referralValid && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                  You're signing up with referral code <strong>{referralCode}</strong>. 
                  Your referrer will earn rewards when you subscribe!
                </AlertDescription>
              </Alert>
            )}
            {referralCode && referralValid === false && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  Invalid referral code. You can still sign up without it.
                </AlertDescription>
              </Alert>
            )}

            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Choose your account type</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "client" | "provider")}>
                <div 
                  className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    role === "client" 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setRole("client")}
                >
                  <RadioGroupItem value="client" id="client" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-5 w-5 text-primary" />
                      <Label htmlFor="client" className="font-semibold text-base cursor-pointer">
                        I'm a Client
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Looking to hire professionals for your needs
                    </p>
                  </div>
                </div>
                <div 
                  className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    role === "provider" 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setRole("provider")}
                >
                  <RadioGroupItem value="provider" id="provider" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <Label htmlFor="provider" className="font-semibold text-base cursor-pointer">
                        I'm a Provider
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ready to offer my professional services
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10 text-base"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 pr-10 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pl-10 pr-10 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? "Creating your account..." : "Create account"}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account?</span>{" "}
              <Link to="/auth/login" className="font-semibold text-primary hover:underline underline-offset-4">
                Sign in
              </Link>
            </div>
          </form>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              <span>←</span> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
