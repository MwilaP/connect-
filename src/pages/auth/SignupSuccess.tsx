import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Link } from "react-router-dom"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account Created!</CardTitle>
            <CardDescription>Welcome to ConnectPro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account has been created successfully. You can now log in and complete your profile to start using the platform.
            </p>
            <p className="text-sm text-muted-foreground">
              Note: If email confirmation is enabled, please check your email for a confirmation link.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
