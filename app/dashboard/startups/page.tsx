import Link from "next/link"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import StartupCard from "@/components/startup/cards/StartupCard"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function StartupsPage() {
  const supabase = await createServerComponentClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // This should be handled by middleware
  }

  // Fetch user's startups
  const { data: startups, error } = await supabase
    .from("startups")
    .select(`
      *,
      categories(id, name)
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching startups:", error)
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Startups</h1>
        <Link href="/dashboard/startups/create">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Startup
          </Button>
        </Link>
      </div>

      {startups && startups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No startups yet</h2>
          <p className="text-muted-foreground mb-6">Create your first startup to get started</p>
          <Link href="/dashboard/startups/create">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Your First Startup
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
