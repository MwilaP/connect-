import type React from "react"
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { createClient } from "../lib/supabase/client"
import type { ClientProfile } from "../lib/types"
import { Upload, X } from "lucide-react"

interface ClientProfileFormProps {
  profile?: ClientProfile
}

export function ClientProfileForm({ profile }: ClientProfileFormProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    age: profile?.age?.toString() || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    preferences: profile?.preferences || "",
    photo_url: profile?.photo_url || "",
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Delete old photo if exists
      if (formData.photo_url) {
        const oldPath = formData.photo_url.split("/").slice(-2).join("/")
        await supabase.storage.from("client-photos").remove([oldPath])
      }

      // Upload new photo
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage.from("client-photos").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("client-photos").getPublicUrl(fileName)

      setFormData({ ...formData, photo_url: publicUrl })
    } catch (err) {
      console.error("Error uploading photo:", err)
      setError(err instanceof Error ? err.message : "Failed to upload photo")
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = () => {
    setFormData({ ...formData, photo_url: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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

      // Validate age if provided
      let ageValue: number | null = null
      if (formData.age.trim()) {
        ageValue = parseInt(formData.age)
        if (isNaN(ageValue) || ageValue < 18) {
          throw new Error("Age must be 18 or older")
        }
      }

      const profileData = {
        user_id: user.id,
        name: formData.name.trim(),
        age: ageValue,
        location: formData.location.trim(),
        bio: formData.bio.trim() || null,
        preferences: formData.preferences.trim() || null,
        photo_url: formData.photo_url || null,
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
        <Label htmlFor="photo">Profile Photo</Label>
        <div className="flex items-center gap-4">
          {formData.photo_url ? (
            <div className="relative">
              <img
                src={formData.photo_url}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <Input
              ref={fileInputRef}
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a profile photo (max 5MB)
            </p>
          </div>
        </div>
      </div>

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
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min="18"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          placeholder="Your age (18+)"
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
        <Button type="submit" disabled={loading || uploading} className="flex-1">
          {loading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading || uploading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
