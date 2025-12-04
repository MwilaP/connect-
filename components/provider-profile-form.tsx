import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "../lib/supabase/client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent } from "./ui/card"
import { X, Upload, Plus, Trash2, User, Calendar, Phone, MapPin, FileText, Briefcase, Image as ImageIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { ProviderProfile, ProviderService } from "../lib/types"
import { calculateAge, isAtLeast18 } from "../lib/age-utils"
import { locationData, getCitiesByCountry, getAreasByCity, formatLocation } from "../lib/location-data"

interface ProviderProfileFormProps {
  userId: string
  existingProfile?: ProviderProfile
  onStepChange?: (step: number) => void
}

export function ProviderProfileForm({ userId, existingProfile, onStepChange }: ProviderProfileFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(currentStep)
  }, [currentStep, onStepChange])

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
    country: existingProfile?.country || "",
    city: existingProfile?.city || "",
    area: existingProfile?.area || "",
    bio: existingProfile?.bio || "",
    country_code: contactParts.code,
    phone_number: contactParts.number,
  })

  const [images, setImages] = useState<string[]>(existingProfile?.images || [])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [services, setServices] = useState<Array<{ service_name: string; price: string; description: string }>>([])
  const [existingServices, setExistingServices] = useState<ProviderService[]>(existingProfile?.services || [])

  const validateStep = (step: number): boolean => {
    setError(null)
    
    if (step === 1) {
      // Validate Personal Information & Location
      if (!formData.name.trim()) {
        setError("Please enter your full name")
        return false
      }
      if (!formData.date_of_birth) {
        setError("Please enter your date of birth")
        return false
      }
      if (!isAtLeast18(formData.date_of_birth)) {
        setError("You must be at least 18 years old to create a provider profile")
        return false
      }
      if (!formData.country) {
        setError("Please select your country")
        return false
      }
      if (!formData.city) {
        setError("Please select your city")
        return false
      }
      return true
    }
    
    if (step === 2) {
      // Validate Services
      if (services.length === 0 && existingServices.length === 0) {
        setError("Please add at least one service")
        return false
      }
      // Validate each service has required fields
      for (let i = 0; i < services.length; i++) {
        if (!services[i].service_name.trim()) {
          setError(`Please enter a name for service ${i + 1}`)
          return false
        }
        if (!services[i].price || Number.parseFloat(services[i].price) <= 0) {
          setError(`Please enter a valid price for service ${i + 1}`)
          return false
        }
      }
      return true
    }
    
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        location: formatLocation(formData.country, formData.city, formData.area), // Legacy field
        country: formData.country || null,
        city: formData.city || null,
        area: formData.area || null,
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Step 1: Personal Information & Location */}
      {currentStep === 1 && (
        <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <p className="text-sm text-muted-foreground">Tell us about yourself</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="h-11"
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
              <Label htmlFor="contact_number" className="text-sm font-medium">Contact Number (Optional)</Label>
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
                  className="flex-1 h-11"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Location</h2>
              <p className="text-sm text-muted-foreground">Where are you based?</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => {
                  setFormData({ ...formData, country: value, city: "", area: "" })
                }}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {locationData.countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.country && (
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => {
                    setFormData({ ...formData, city: value, area: "" })
                  }}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCitiesByCountry(formData.country).map((city) => (
                      <SelectItem key={city.name} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.country && formData.city && (
              <div className="space-y-2">
                <Label htmlFor="area">Area/Neighborhood</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Enter your area or neighborhood"
                  list="area-suggestions"
                />
                <datalist id="area-suggestions">
                  {getAreasByCity(formData.country, formData.city).map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Start typing to see suggestions, or enter your own area
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bio Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">About You</h2>
              <p className="text-sm text-muted-foreground">Tell clients about yourself</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell clients about yourself and your services..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Share your experience, skills, and what makes you unique
            </p>
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Step 2: Services */}
      {currentStep === 2 && (
        <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Services Offered</h2>
              <p className="text-sm text-muted-foreground">Add the services you provide</p>
            </div>
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

          <div className="space-y-4">
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
        </CardContent>
      </Card>
        </>
      )}

      {/* Step 3: Photos */}
      {currentStep === 3 && (
        <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Profile Photos</h2>
              <p className="text-sm text-muted-foreground">Add up to 5 photos (optional)</p>
            </div>
          </div>

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
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <div
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const input = document.getElementById('image-upload') as HTMLInputElement
                      input?.click()
                    }}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload Images</span>
                  </div>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t -mx-4">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              prevStep()
            }}
            disabled={isLoading || uploadingImages}
            className="h-12"
          >
            Previous
          </Button>
        )}
        
        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              nextStep()
            }}
            disabled={isLoading}
            className="flex-1 h-12 text-base font-semibold"
          >
            Next Step
          </Button>
        ) : (
          <Button 
            type="submit" 
            disabled={isLoading || uploadingImages} 
            className="flex-1 h-12 text-base font-semibold"
          >
            {uploadingImages
              ? "Uploading images..."
              : isLoading
                ? "Saving..."
                : existingProfile
                  ? "Update Profile"
                  : "Create Profile"}
          </Button>
        )}
        
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isLoading || uploadingImages}
          className="h-12"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
