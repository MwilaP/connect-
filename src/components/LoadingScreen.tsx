import { Link } from 'react-router-dom'
import { Spinner } from '../../components/ui/spinner'
import { Button } from '../../components/ui/button'
import type { User } from '@supabase/supabase-js'

interface LoadingScreenProps {
  user?: User | null
  showHeader?: boolean
  message?: string
}

export function LoadingScreen({ user, showHeader = true, message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {showHeader && (
        <header className="border-b bg-background sticky top-0 z-50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="text-xl font-semibold">
              ConnectPro
            </Link>
            <nav className="flex items-center gap-4">
              {user ? (
                <Button variant="ghost" disabled>
                  Loading...
                </Button>
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
      )}
      
      <main className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-12 text-primary" />
          <p className="text-lg font-medium text-muted-foreground">{message}</p>
        </div>
      </main>
    </div>
  )
}
