"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Database } from "@/types/database"

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  roles?: {
    name: string
  } | null
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      try {
        // Get session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        setUserEmail(session.user.email || null)

        // Get user profile
        const { data } = await supabase
          .from("profiles")
          .select("*, roles(name)")
          .eq("id", session.user.id)
          .single()

        setProfile(data)
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error loading profile",
          description: "There was a problem loading your profile information.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((name: string) => name[0]).join("")
    : "U"

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal information and account details</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User avatar"} />
              ) : (
                <AvatarFallback className="text-2xl">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="space-y-4 w-full">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                <p className="text-lg">{profile?.full_name || "No name set"}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                <p className="text-lg">{userEmail || "No email available"}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Role</h3>
                <p className="text-lg capitalize">{profile?.roles?.name || "User"}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Joined</h3>
                <p className="text-lg">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>

              <Button className="w-full mt-4" onClick={() => router.push("/dashboard/profile/edit")}>
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>Your recent account activity and startup actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your account activity will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 