import { createClient } from "@/lib/supabase/server"
import { ProviderCard } from "@/components/provider-card"
import { ProviderFilters } from "@/components/provider-filters"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SearchParams {
  location?: string
  minRate?: string
  maxRate?: string
  minAge?: string
  maxAge?: string
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query with filters
  let query = supabase.from("provider_profiles").select("*").order("created_at", { ascending: false })

  if (params.location) {
    query = query.ilike("location", `%${params.location}%`)
  }

  if (params.minRate) {
    query = query.gte("hourly_rate", Number.parseFloat(params.minRate))
  }

  if (params.maxRate) {
    query = query.lte("hourly_rate", Number.parseFloat(params.maxRate))
  }

  if (params.minAge) {
    query = query.gte("age", Number.parseInt(params.minAge))
  }

  if (params.maxAge) {
    query = query.lte("age", Number.parseInt(params.maxAge))
  }

  const { data: providers, error } = await query

  if (error) {
    console.error("[v0] Error fetching providers:", error)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userRole = user?.user_metadata?.role

  let hasProviderProfile = false
  let hasClientProfile = false

  if (user) {
    const { data: providerProfile } = await supabase
      .from("provider_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    hasProviderProfile = !!providerProfile
    hasClientProfile = !!clientProfile
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-semibold">
            ConnectPro
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                {userRole === "provider" && hasProviderProfile && (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/provider/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/provider/profile">My Profile</Link>
                    </Button>
                  </>
                )}
                {userRole === "client" && hasClientProfile && (
                  <Button variant="ghost" asChild>
                    <Link href="/client/profile">My Profile</Link>
                  </Button>
                )}
                <form action="/auth/signout" method="post">
                  <Button variant="ghost" type="submit">
                    Sign Out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Providers</h1>
          <p className="mt-2 text-muted-foreground">Find the perfect service provider for your needs</p>
        </div>

        {/* Filters */}
        <ProviderFilters />

        {/* Results */}
        <div className="mt-8">
          {providers && providers.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {providers.length} provider{providers.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No providers found</p>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters or check back later</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
