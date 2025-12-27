import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Link, useSearchParams } from "react-router-dom"
import { AlertCircle } from "lucide-react"

export default function ErrorPage() {
  const [searchParams] = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-b from-red-50/50 to-background">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-semibold">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {error ? (
              <p className="text-center text-muted-foreground leading-relaxed">
                {error}
              </p>
            ) : (
              <p className="text-center text-muted-foreground leading-relaxed">
                An unexpected error occurred during authentication.
              </p>
            )}
            <Button asChild className="w-full h-12 rounded-full text-base font-medium">
              <Link to="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
