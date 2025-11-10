import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { createClient } from "../lib/supabase/client"
import type { ClientProfile } from "../lib/types"

interface ClientProfileFormProps {
  profile?: ClientProfile
}

export function ClientProfileForm({ profile }: ClientProfileFormProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    preferences: profile?.preferences || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Name is required")
      }
      if (!formData.location.trim()) {
        throw new Error("Location is required")
      }

      const profileData = {
        user_id: user.id,
        name: formData.name.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim() || null,
        preferences: formData.preferences.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (profile) {
        // Update existing profile
        const { error: updateError } = await supabase.from("client_profiles").update(profileData).eq("id", profile.id)

        if (updateError) throw updateError
      } else {
        // Create new profile
        const { error: insertError } = await supabase.from("client_profiles").insert(profileData)

        if (insertError) throw insertError
      }

      navigate("/client/profile")
    } catch (err) {
      console.error("[v0] Error saving profile:", err)
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">
          Location <span className="text-destructive">*</span>
        </Label>
        <Input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="City, State"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferences">Service Preferences</Label>
        <Textarea
          id="preferences"
          value={formData.preferences}
          onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
          placeholder="What are you looking for in a service provider?"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
