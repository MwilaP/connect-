import { Link } from "react-router-dom"
import { MapPin, Crown, ChevronRight } from "lucide-react"
import type { ProviderProfile } from "../lib/types"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Badge } from "./ui/badge"

interface ProviderCardProps {
  provider: ProviderProfile
  blurred?: boolean
}

export function ProviderCard({ provider, blurred = false }: ProviderCardProps) {
  const primaryImage = provider.images?.[0]
  const cityName = provider.city || provider.location?.split(',')[0] || "Unknown"
  const serviceCount = provider.services?.length || 0

  return (
    <Link to={`/browse/${provider.id}`} className="block group">
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30">
        {/* Image Container */}
        <div className="aspect-[4/5] overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 relative">
          {primaryImage ? (
            <>
              <img 
                src={primaryImage} 
                alt={provider.name} 
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${blurred ? 'blur-md' : ''}`}
              />
              {blurred && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col items-center justify-center text-white">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full p-4 mb-3 shadow-xl">
                    <Crown className="h-7 w-7" />
                  </div>
                  <p className="text-base font-semibold mb-1">Premium Content</p>
                  <p className="text-xs text-white/80">Subscribe to unlock</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <Avatar className="h-28 w-28 shadow-lg">
                <AvatarFallback className="text-5xl font-bold bg-primary/10 text-primary">
                  {provider.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Service Count Badge */}
          {serviceCount > 0 && !blurred && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm border-0 shadow-md">
                {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground mb-1.5 truncate group-hover:text-primary transition-colors">
                {provider.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{cityName}</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}
