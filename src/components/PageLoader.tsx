import { Spinner } from '../../components/ui/spinner'
import { Skeleton } from '../../components/ui/skeleton'

interface PageLoaderProps {
  message?: string
  variant?: 'spinner' | 'skeleton'
  className?: string
}

export function PageLoader({ message = 'Loading...', variant = 'spinner', className }: PageLoaderProps) {
  if (variant === 'skeleton') {
    return (
      <div className={className || 'space-y-4'}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className={className || 'flex min-h-[400px] items-center justify-center'}>
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-12 text-primary" />
        {message && <p className="text-lg font-medium text-muted-foreground">{message}</p>}
      </div>
    </div>
  )
}
