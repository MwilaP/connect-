import { Link } from "react-router-dom"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { MapPin, Lock, Star } from "lucide-react"
import type { ProviderProfile } from "../lib/types"
import { formatLocation } from "../lib/location-data"

interface ProviderCardProps {
  provider: ProviderProfile
  blurred?: boolean
}

export function ProviderCard({ provider, blurred = false }: ProviderCardProps) {
  const primaryImage = provider.images?.[0]

  return (
    <Card className="overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 duration-300 border-border/50 bg-card">
      <div className="aspect-[4/3] sm:aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50 relative group">
        {primaryImage ? (
          <>
            <img 
              src={primaryImage || "/placeholder.svg"} 
              alt={provider.name} 
              className={`h-full w-full object-cover transition-all duration-300 ${blurred ? 'blur-sm scale-105' : 'group-hover:scale-105'}`}
            />
            {blurred && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/20 flex flex-col items-center justify-center text-white p-4 backdrop-blur-sm">
                <div className="bg-primary/90 rounded-full p-3 sm:p-4 mb-3">
                  <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-sm sm:text-base font-semibold text-center">Subscribe to view</p>
                <p className="text-xs sm:text-sm text-white/80 mt-1">Unlock full access</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl sm:text-3xl">📷</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">No image</span>
            </div>
          </div>
        )}
      </div>
      
      <CardHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold leading-tight line-clamp-1">{provider.name}</h3>
          {provider.rating && (
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full shrink-0">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary">{provider.rating}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="line-clamp-1">
            {provider.country && provider.city
              ? formatLocation(provider.country, provider.city, provider.area || undefined)
              : provider.location || "Location not specified"}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 pb-4">
        {provider.bio && (
          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {provider.bio}
          </p>
        )}
        
        {provider.services && provider.services.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Services</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {provider.services.slice(0, 3).map((service) => (
                <Badge 
                  key={service.id} 
                  variant="secondary" 
                  className="text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1"
                >
                  {service.service_name} - K{service.price}
                </Badge>
              ))}
              {provider.services.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 border-dashed"
                >
                  +{provider.services.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild className="w-full touch-target h-10 sm:h-11 text-sm sm:text-base font-semibold">
          <Link to={`/browse/${provider.id}`}>View Full Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
