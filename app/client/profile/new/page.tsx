import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ClientProfileForm } from "@/components/client-profile-form"

export default async function NewClientProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user already has a profile
  const { data: existingProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingProfile) {
    redirect("/client/profile")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">ConnectPro</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Tell us about yourself to get started</p>
        </div>

        <ClientProfileForm />
      </div>
    </div>
  )
}
