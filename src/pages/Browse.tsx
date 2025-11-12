import { Button } from "../../components/ui/button"
import { Link } from "react-router-dom"
import type { User } from "@supabase/supabase-js"

interface BrowseProps {
  user: User | null
}

export default function Browse({ user }: BrowseProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">ConnectPro</h1>
          <nav className="flex gap-4">
            {user ? (
              <Button variant="ghost">Logout</Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold">Browse Providers</h2>
          <p className="mt-2 text-muted-foreground">
            Find the perfect service provider for your needs
          </p>
          {/* Add your browse/filter functionality here */}
        </div>
      </main>
    </div>
  )
}
