import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Filter } from "lucide-react"
import { locationData, getCitiesByCountry, getAreasByCity } from "../lib/location-data"

export function ProviderFilters() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Providers</DialogTitle>
          <DialogDescription>
            Select country, then city, then area to narrow your search
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {locationData.countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select value={city} onValueChange={setCity} disabled={!country}>
              <SelectTrigger id="city">
                <SelectValue placeholder={country ? "Select city" : "Select country first"} />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area</Label>
            <Select value={area} onValueChange={setArea} disabled={!city}>
              <SelectTrigger id="area">
                <SelectValue placeholder={city ? "Select area" : "Select city first"} />
              </SelectTrigger>
              <SelectContent>
                {availableAreas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleFilter} className="flex-1">
            Apply Filters
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
