import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check user role and redirect to appropriate page
    const userRole = user.user_metadata?.role

    if (userRole === "provider") {
      // Check if provider has a profile
      const { data: providerProfile } = await supabase
        .from("provider_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (providerProfile) {
        redirect("/provider/dashboard")
      } else {
        redirect("/provider/profile/new")
      }
    } else if (userRole === "client") {
      // Check if client has a profile
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (clientProfile) {
        redirect("/browse")
      } else {
        redirect("/client/profile/new")
      }
    } else {
      // Default to browse if no role set
      redirect("/browse")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">ConnectPro</h1>
          <nav className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section className="container mx-auto flex flex-col items-center justify-center gap-6 px-4 py-24 text-center md:py-32">
          <h2 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Connect with Professional Service Providers
          </h2>
          <p className="text-pretty max-w-2xl text-lg text-muted-foreground md:text-xl">
            Browse verified providers, compare rates, and find the perfect match for your needs. Join our trusted
            marketplace today.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/browse">Browse Providers</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h3 className="mb-12 text-center text-3xl font-bold">How It Works</h3>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                  1
                </div>
                <h4 className="text-xl font-semibold">Create Your Account</h4>
                <p className="text-muted-foreground">
                  Sign up as a client to browse providers or as a provider to offer your services
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                  2
                </div>
                <h4 className="text-xl font-semibold">Browse & Filter</h4>
                <p className="text-muted-foreground">
                  Search providers by location, price range, and other criteria to find your perfect match
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
                  3
                </div>
                <h4 className="text-xl font-semibold">Connect & Hire</h4>
                <p className="text-muted-foreground">
                  View detailed profiles with photos and reviews, then connect with your chosen provider
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 ConnectPro. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
