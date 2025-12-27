import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Filter, X, MapPin } from "lucide-react"
import { Badge } from "./ui/badge"
import { locationData, getCitiesByCountry, getAreasByCity } from "../lib/location-data"

interface ProviderFiltersProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProviderFilters({ open: controlledOpen, onOpenChange }: ProviderFiltersProps = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [country, setCountry] = useState(searchParams.get("country") || "")
  const [city, setCity] = useState(searchParams.get("city") || "")
  const [area, setArea] = useState(searchParams.get("area") || "")

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (!country) {
      setCity("")
      setArea("")
    }
  }, [country])

  useEffect(() => {
    if (!city) {
      setArea("")
    }
  }, [city])

  const handleFilter = () => {
    const params = new URLSearchParams()

    if (country) params.set("country", country)
    if (city) params.set("city", city)
    if (area) params.set("area", area)

    navigate(`/browse?${params.toString()}`)
    setOpen(false)
  }

  const handleClear = () => {
    setCountry("")
    setCity("")
    setArea("")
    navigate("/browse")
    setOpen(false)
  }

  const availableCities = country ? getCitiesByCountry(country) : []
  const availableAreas = country && city ? getAreasByCity(country, city) : []

  const activeFiltersCount = [country, city, area].filter(Boolean).length
  const countryName = country ? locationData.countries.find(c => c.code === country)?.name : null

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {country && (
            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-2 text-sm font-medium bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground border border-gray-200 dark:border-border hover:bg-gray-200 dark:hover:bg-muted/80 rounded-full">
              <MapPin className="h-4 w-4" />
              <span>{countryName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-gray-300 dark:hover:bg-muted rounded-full ml-1"
                onClick={() => {
                  setCountry("")
                  setCity("")
                  setArea("")
                  navigate("/browse")
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {city && (
            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-2 text-sm font-medium bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground border border-gray-200 dark:border-border hover:bg-gray-200 dark:hover:bg-muted/80 rounded-full">
              <span>{city}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-gray-300 dark:hover:bg-muted rounded-full ml-1"
                onClick={() => {
                  setCity("")
                  setArea("")
                  const params = new URLSearchParams()
                  if (country) params.set("country", country)
                  navigate(`/browse?${params.toString()}`)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {area && (
            <Badge variant="secondary" className="gap-2 pl-3 pr-2 py-2 text-sm font-medium bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground border border-gray-200 dark:border-border hover:bg-gray-200 dark:hover:bg-muted/80 rounded-full">
              <span>{area}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-gray-300 dark:hover:bg-muted rounded-full ml-1"
                onClick={() => {
                  setArea("")
                  const params = new URLSearchParams()
                  if (country) params.set("country", country)
                  if (city) params.set("city", city)
                  navigate(`/browse?${params.toString()}`)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-muted rounded-lg"
            onClick={handleClear}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl bg-white dark:bg-card border-t border-gray-200 dark:border-border p-0">
          <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header - Fixed */}
            <SheetHeader className="text-left px-6 pt-6 pb-4 border-b border-gray-200 dark:border-border">
              <SheetTitle className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-foreground">Filter by Location</SheetTitle>
              <SheetDescription className="text-sm sm:text-base text-gray-600 dark:text-muted-foreground mt-1">
                Narrow your search to find providers in your area
              </SheetDescription>
            </SheetHeader>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold text-gray-900 dark:text-foreground">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country" className="h-12 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-background hover:border-gray-400 dark:hover:border-border focus:ring-2 focus:ring-gray-900 dark:focus:ring-primary focus:border-gray-900 dark:focus:border-primary">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-gray-200 dark:border-border shadow-lg">
                      {locationData.countries.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-muted">
                          <span className="text-base">{c.flag} {c.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-900 dark:text-foreground">City</Label>
                  <Select value={city} onValueChange={setCity} disabled={!country}>
                    <SelectTrigger id="city" className="h-12 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-background hover:border-gray-400 dark:hover:border-border focus:ring-2 focus:ring-gray-900 dark:focus:ring-primary focus:border-gray-900 dark:focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue placeholder={country ? "Select city" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-gray-200 dark:border-border shadow-lg">
                      {availableCities.map((c) => (
                        <SelectItem key={c.name} value={c.name} className="py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-muted">
                          <span className="text-base">{c.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area" className="text-sm font-semibold text-gray-900 dark:text-foreground">Area</Label>
                  <Select value={area} onValueChange={setArea} disabled={!city}>
                    <SelectTrigger id="area" className="h-12 rounded-lg border border-gray-300 dark:border-border bg-white dark:bg-background hover:border-gray-400 dark:hover:border-border focus:ring-2 focus:ring-gray-900 dark:focus:ring-primary focus:border-gray-900 dark:focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue placeholder={city ? "Select area" : "Select city first"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border border-gray-200 dark:border-border shadow-lg">
                      {availableAreas.map((a) => (
                        <SelectItem key={a} value={a} className="py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-muted">
                          <span className="text-base">{a}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-border bg-white dark:bg-card">
              <div className="flex gap-3">
                <Button onClick={handleFilter} className="flex-1 h-12 text-base font-semibold rounded-lg bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 shadow-sm">
                  Apply Filters
                </Button>
                <Button onClick={handleClear} variant="outline" className="h-12 px-6 text-base font-semibold rounded-lg border-gray-300 dark:border-border hover:bg-gray-100 dark:hover:bg-muted">
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
