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
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join our marketplace as a client or provider</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup}>
              <div className="flex flex-col gap-6">
                {referralCode && referralValid && (
                  <Alert className="bg-green-50 border-green-200">
                    <Gift className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      You're signing up with referral code <strong>{referralCode}</strong>. 
                      Your referrer will earn rewards when you subscribe!
                    </AlertDescription>
                  </Alert>
                )}
                {referralCode && referralValid === false && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Invalid referral code. You can still sign up without it.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label>I want to</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "client" | "provider")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="font-normal">
                        Browse and hire providers
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="provider" id="provider" />
                      <Label htmlFor="provider" className="font-normal">
                        Offer my services as a provider
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link to="/auth/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
