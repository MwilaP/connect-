import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { MapPin, Lock } from "lucide-react"
import type { ProviderProfile } from "../lib/types"
import { formatLocation } from "../lib/location-data"

interface ProviderCardProps {
  provider: ProviderProfile
  blurred?: boolean
}

export function ProviderCard({ provider, blurred = false }: ProviderCardProps) {
  const primaryImage = provider.images?.[0]

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-video overflow-hidden bg-muted relative">
        {primaryImage ? (
          <>
            <img 
              src={primaryImage || "/placeholder.svg"} 
              alt={provider.name} 
              className={`h-full w-full object-cover transition-all ${blurred ? 'blur-sm scale-105' : ''}`}
            />
            {blurred && (
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white p-4">
                <Lock className="h-6 w-6 mb-2" />
                <p className="text-sm font-medium text-center">Subscribe to view</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <CardHeader>
        <h3 className="text-xl font-semibold">{provider.name}</h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {provider.country && provider.city
              ? formatLocation(provider.country, provider.city, provider.area || undefined)
              : provider.location || "Location not specified"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {provider.bio && <p className="line-clamp-2 text-sm text-muted-foreground">{provider.bio}</p>}
        
        {provider.services && provider.services.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Services:</p>
            <div className="flex flex-wrap gap-2">
              {provider.services.slice(0, 3).map((service) => (
                <Badge key={service.id} variant="secondary" className="text-xs">
                  {service.service_name} - K{service.price}
                </Badge>
              ))}
              {provider.services.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{provider.services.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/browse/${provider.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
