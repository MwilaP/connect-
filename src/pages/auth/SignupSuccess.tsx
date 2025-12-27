import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Link } from "react-router-dom"
import { CheckCircle2, Sparkles } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-b from-green-50/50 to-background">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-semibold">Account Created!</CardTitle>
            <CardDescription className="text-base mt-2">Welcome to ConnectPro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="space-y-3 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your account has been created successfully. You can now log in and complete your profile to start using the platform.
                </p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Note: If email confirmation is enabled, please check your email for a confirmation link.
            </p>
            <Button asChild className="w-full h-12 rounded-full text-base font-medium">
              <Link to="/auth/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
