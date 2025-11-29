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
import { Gift } from "lucide-react"

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
    <div className="flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-xl sm:text-2xl font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            ConnectPro
          </h1>
        </div>
        
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-2 sm:space-y-3 pb-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Join our marketplace as a client or provider
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSignup}>
              <div className="flex flex-col gap-5 sm:gap-6">
                {referralCode && referralValid && (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200 text-sm sm:text-base">
                      You're signing up with referral code <strong>{referralCode}</strong>. 
                      Your referrer will earn rewards when you subscribe!
                    </AlertDescription>
                  </Alert>
                )}
                {referralCode && referralValid === false && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm sm:text-base">
                      Invalid referral code. You can still sign up without it.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-3">
                  <Label className="text-sm sm:text-base font-medium">I want to</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "client" | "provider")}>
                    <div className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="client" id="client" className="touch-target" />
                      <Label htmlFor="client" className="font-normal text-sm sm:text-base cursor-pointer flex-1">
                        Browse and hire providers
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="provider" id="provider" className="touch-target" />
                      <Label htmlFor="provider" className="font-normal text-sm sm:text-base cursor-pointer flex-1">
                        Offer my services as a provider
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 sm:h-12 text-base"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="password" className="text-sm sm:text-base font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 sm:h-12 text-base"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="confirm-password" className="text-sm sm:text-base font-medium">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 sm:h-12 text-base"
                  />
                </div>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full touch-target h-11 sm:h-12 text-base font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm sm:text-base">
                <span className="text-muted-foreground">Already have an account?</span>{" "}
                <Link to="/auth/login" className="font-semibold text-primary hover:underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
