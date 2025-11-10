import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../lib/supabase/client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent } from "./ui/card"
import { X, Upload } from "lucide-react"
import type { ProviderProfile } from "../lib/types"

interface ProviderProfileFormProps {
  userId: string
  existingProfile?: ProviderProfile
}

export function ProviderProfileForm({ userId, existingProfile }: ProviderProfileFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)

  const [formData, setFormData] = useState({
    name: existingProfile?.name || "",
    age: existingProfile?.age || "",
    location: existingProfile?.location || "",
    hourly_rate: existingProfile?.hourly_rate || "",
    bio: existingProfile?.bio || "",
  })

  const [images, setImages] = useState<string[]>(existingProfile?.images || [])
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (images.length + files.length > 5) {
      setError("You can only upload up to 5 images")
      return
    }

    setImageFiles([...imageFiles, ...files])

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImages([...images, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImages(newImages)
    setImageFiles(newFiles)
  }

  const uploadImagesToStorage = async (): Promise<string[]> => {
    const supabase = createClient()
    const uploadedUrls: string[] = []

    for (const file of imageFiles) {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("provider-images").upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("provider-images").getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Upload new images if any
      let finalImageUrls = existingProfile?.images || []

      if (imageFiles.length > 0) {
        setUploadingImages(true)
        const newImageUrls = await uploadImagesToStorage()
        finalImageUrls = [...finalImageUrls, ...newImageUrls]
        setUploadingImages(false)
      }

      const profileData = {
        user_id: userId,
        name: formData.name,
        age: Number.parseInt(formData.age),
        location: formData.location,
        hourly_rate: Number.parseFloat(formData.hourly_rate),
        bio: formData.bio || null,
        images: finalImageUrls,
        updated_at: new Date().toISOString(),
      }

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("provider_profiles")
          .update(profileData)
          .eq("user_id", userId)

        if (updateError) throw updateError
      } else {
        // Create new profile
        const { error: insertError } = await supabase.from("provider_profiles").insert(profileData)

        if (insertError) throw insertError
      }

      navigate("/provider/dashboard")
    } catch (err) {
      console.error("[v0] Profile save error:", err)
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setIsLoading(false)
      setUploadingImages(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                required
                min="18"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($) *</Label>
              <Input
                id="hourly_rate"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="50.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="New York, NY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell clients about yourself and your services..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Photos (up to 5)</Label>
            <div className="space-y-4">
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {images.map((image, index) => (
                    <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length < 5 && (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload Images</span>
                  </Label>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading || uploadingImages} className="flex-1">
              {uploadingImages
                ? "Uploading images..."
                : isLoading
                  ? "Saving..."
                  : existingProfile
                    ? "Update Profile"
                    : "Create Profile"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isLoading || uploadingImages}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
