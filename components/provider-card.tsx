import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { MapPin, DollarSign } from "lucide-react"
import type { ProviderProfile } from "../lib/types"

interface ProviderCardProps {
  provider: ProviderProfile
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const primaryImage = provider.images?.[0]

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-video overflow-hidden bg-muted">
        {primaryImage ? (
          <img src={primaryImage || "/placeholder.svg"} alt={provider.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <CardHeader>
        <h3 className="text-xl font-semibold">{provider.name}</h3>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{provider.location}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-primary">
            <DollarSign className="h-4 w-4" />
            <span>${provider.hourly_rate}/hour</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {provider.bio && <p className="line-clamp-2 text-sm text-muted-foreground">{provider.bio}</p>}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/browse/${provider.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
