import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Link, useSearchParams } from "react-router-dom"

export default function ErrorPage() {
  const [searchParams] = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="text-sm text-muted-foreground">Error: {error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">An unexpected error occurred during authentication.</p>
            )}
            <Button asChild className="w-full">
              <Link to="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
