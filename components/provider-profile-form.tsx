import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../lib/supabase/client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent } from "./ui/card"
import { X, Upload, Plus, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { ProviderProfile, ProviderService } from "../lib/types"
import { calculateAge, isAtLeast18 } from "../lib/age-utils"

interface ProviderProfileFormProps {
  userId: string
  existingProfile?: ProviderProfile
}

export function ProviderProfileForm({ userId, existingProfile }: ProviderProfileFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Extract country code and phone number from existing contact
  const extractContactParts = (contact?: string | null) => {
    if (!contact) return { code: "+260", number: "" };
    const match = contact.match(/^(\+\d+)\s*(.*)$/);
    if (match) {
      return { code: match[1], number: match[2] };
    }
    return { code: "+260", number: contact };
  };

  const contactParts = extractContactParts(existingProfile?.contact_number);

  const [formData, setFormData] = useState({
    name: existingProfile?.name || "",
    date_of_birth: existingProfile?.date_of_birth || "",
    location: existingProfile?.location || "",
    bio: existingProfile?.bio || "",
    country_code: contactParts.code,
    phone_number: contactParts.number,
  })

  const [images, setImages] = useState<string[]>(existingProfile?.images || [])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [services, setServices] = useState<Array<{ service_name: string; price: string; description: string }>>([])
  const [existingServices, setExistingServices] = useState<ProviderService[]>(existingProfile?.services || [])

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

    // Validate that at least one service exists
    if (services.length === 0 && existingServices.length === 0) {
      setError("Please add at least one service")
      setIsLoading(false)
      return
    }

    // Validate date of birth
    if (!formData.date_of_birth) {
      setError("Please enter your date of birth")
      setIsLoading(false)
      return
    }

    if (!isAtLeast18(formData.date_of_birth)) {
      setError("You must be at least 18 years old to create a provider profile")
      setIsLoading(false)
      return
    }

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
        date_of_birth: formData.date_of_birth,
        age: calculateAge(formData.date_of_birth) || 0,
        location: formData.location,
        bio: formData.bio || null,
        contact_number: formData.phone_number ? `${formData.country_code} ${formData.phone_number}` : null,
        images: finalImageUrls,
        updated_at: new Date().toISOString(),
      }

      let profileId = existingProfile?.id

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("provider_profiles")
          .update(profileData)
          .eq("user_id", userId)

        if (updateError) throw updateError
      } else {
        // Create new profile
        const { data: newProfile, error: insertError } = await supabase
          .from("provider_profiles")
          .insert(profileData)
          .select("id")
          .single()

        if (insertError) throw insertError
        profileId = newProfile.id
      }

      // Handle services
      if (profileId && services.length > 0) {
        // Delete existing services if updating
        if (existingProfile) {
          await supabase.from("provider_services").delete().eq("provider_id", profileId)
        }

        // Insert new services
        const servicesData = services.map((service) => ({
          provider_id: profileId,
          service_name: service.service_name,
          price: Number.parseFloat(service.price),
          description: service.description || null,
        }))

        const { error: servicesError } = await supabase.from("provider_services").insert(servicesData)

        if (servicesError) throw servicesError
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

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
            {formData.date_of_birth && (
              <p className="text-sm text-muted-foreground">
                Age: {calculateAge(formData.date_of_birth)} years
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number (Optional)</Label>
            <div className="flex gap-2">
              <Select
                value={formData.country_code}
                onValueChange={(value) => setFormData({ ...formData, country_code: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+260">🇿🇲 +260</SelectItem>
                  <SelectItem value="+27">🇿🇦 +27</SelectItem>
                  <SelectItem value="+254">🇰🇪 +254</SelectItem>
                  <SelectItem value="+255">🇹🇿 +255</SelectItem>
                  <SelectItem value="+256">🇺🇬 +256</SelectItem>
                  <SelectItem value="+263">🇿🇼 +263</SelectItem>
                  <SelectItem value="+265">🇲🇼 +265</SelectItem>
                  <SelectItem value="+267">🇧🇼 +267</SelectItem>
                  <SelectItem value="+1">🇺🇸 +1</SelectItem>
                  <SelectItem value="+44">🇬🇧 +44</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="contact_number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="971234567"
                className="flex-1"
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Services Offered *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setServices([...services, { service_name: "", price: "", description: "" }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            {services.length === 0 && existingServices.length === 0 && (
              <p className="text-sm text-muted-foreground">Add at least one service to continue</p>
            )}

            {existingServices.length > 0 && services.length === 0 && (
              <div className="space-y-3">
                {existingServices.map((service, index) => (
                  <Card key={service.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{service.service_name}</p>
                          <p className="text-sm text-primary font-semibold">K{service.price}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setServices(existingServices.map(s => ({
                      service_name: s.service_name,
                      price: s.price.toString(),
                      description: s.description || ""
                    })))
                    setExistingServices([])
                  }}
                >
                  Edit Services
                </Button>
              </div>
            )}

            {services.map((service, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`service-name-${index}`}>Service Name *</Label>
                          <Input
                            id={`service-name-${index}`}
                            required
                            value={service.service_name}
                            onChange={(e) => {
                              const newServices = [...services]
                              newServices[index].service_name = e.target.value
                              setServices(newServices)
                            }}
                            placeholder="e.g., Computer Fixing"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`service-price-${index}`}>Price (K) *</Label>
                          <Input
                            id={`service-price-${index}`}
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={service.price}
                            onChange={(e) => {
                              const newServices = [...services]
                              newServices[index].price = e.target.value
                              setServices(newServices)
                            }}
                            placeholder="250"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`service-description-${index}`}>Description (Optional)</Label>
                          <Textarea
                            id={`service-description-${index}`}
                            value={service.description}
                            onChange={(e) => {
                              const newServices = [...services]
                              newServices[index].description = e.target.value
                              setServices(newServices)
                            }}
                            placeholder="Brief description of this service..."
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setServices(services.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
