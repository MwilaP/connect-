import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent } from "./ui/card"

export function ProviderFilters() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [minRate, setMinRate] = useState(searchParams.get("minRate") || "")
  const [maxRate, setMaxRate] = useState(searchParams.get("maxRate") || "")
  const [minAge, setMinAge] = useState(searchParams.get("minAge") || "")
  const [maxAge, setMaxAge] = useState(searchParams.get("maxAge") || "")

  const handleFilter = () => {
    const params = new URLSearchParams()

    if (location) params.set("location", location)
    if (minRate) params.set("minRate", minRate)
    if (maxRate) params.set("maxRate", maxRate)
    if (minAge) params.set("minAge", minAge)
    if (maxAge) params.set("maxAge", maxAge)

    navigate(`/browse?${params.toString()}`)
  }

  const handleClear = () => {
    setLocation("")
    setMinRate("")
    setMaxRate("")
    setMinAge("")
    setMaxAge("")
    navigate("/browse")
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., New York"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Hourly Rate Range</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="Min" value={minRate} onChange={(e) => setMinRate(e.target.value)} />
              <Input type="number" placeholder="Max" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Age Range</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="Min" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
              <Input type="number" placeholder="Max" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handleFilter} className="flex-1">
            Apply Filters
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
