import { Link } from "react-router-dom"
import { Card } from "./ui/card"
import { MapPin, Lock } from "lucide-react"
import type { ProviderProfile } from "../lib/types"

interface ProviderCardProps {
  provider: ProviderProfile
  blurred?: boolean
}

export function ProviderCard({ provider, blurred = false }: ProviderCardProps) {
  const primaryImage = provider.images?.[0]
  const cityName = provider.city || provider.location?.split(',')[0] || "Unknown"

  return (
    <Link to={`/browse/${provider.id}`}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 duration-300 cursor-pointer">
        {/* Large Image */}
        <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50 relative">
          {primaryImage ? (
            <>
              <img 
                src={primaryImage} 
                alt={provider.name} 
                className={`h-full w-full object-cover transition-all duration-300 ${blurred ? 'blur-sm scale-105' : 'group-hover:scale-105'}`}
              />
              {blurred && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/20 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                  <div className="bg-primary/90 rounded-full p-4 mb-3">
                    <Lock className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold">Subscribe to view</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-4xl font-bold text-primary">
                    {provider.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">No image</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Content - Name and City Only */}
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {provider.name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{cityName}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
