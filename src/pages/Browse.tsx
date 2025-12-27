import { Button } from "../../components/ui/button"
import { Link } from "react-router-dom"
import type { User } from "@supabase/supabase-js"

interface BrowseProps {
  user: User | null
}

export default function Browse({ user }: BrowseProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">C</span>
            </div>
            <h1 className="text-xl font-bold">ConnectPro</h1>
          </Link>
          <nav className="flex gap-3">
            {user ? (
              <Button variant="ghost" size="default" className="rounded-full">Logout</Button>
            ) : (
              <>
                <Button variant="ghost" size="default" className="rounded-full" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button size="default" className="rounded-full" asChild>
                  <Link to="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="mb-8">
            <h2 className="text-4xl font-semibold mb-3">Browse Providers</h2>
            <p className="text-lg text-muted-foreground">
              Find the perfect service provider for your needs
            </p>
          </div>
          {/* Add your browse/filter functionality here */}
        </div>
      </main>
    </div>
  )
}
