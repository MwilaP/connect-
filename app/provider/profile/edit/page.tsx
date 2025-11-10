import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProviderProfileForm } from "@/components/provider-profile-form"

export default async function EditProviderProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("provider_profiles").select("*").eq("user_id", user.id).single()

  if (!profile) {
    redirect("/provider/profile/new")
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Your Provider Profile</h1>
        <p className="mt-2 text-muted-foreground">Update your information to attract more clients</p>
      </div>
      <ProviderProfileForm userId={user.id} existingProfile={profile} />
    </div>
  )
}
