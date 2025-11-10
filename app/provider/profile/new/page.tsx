import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProviderProfileForm } from "@/components/provider-profile-form"

export default async function NewProviderProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (existingProfile) {
    redirect("/provider/profile/edit")
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Your Provider Profile</h1>
        <p className="mt-2 text-muted-foreground">Fill out your profile to start connecting with clients</p>
      </div>
      <ProviderProfileForm userId={user.id} />
    </div>
  )
}
