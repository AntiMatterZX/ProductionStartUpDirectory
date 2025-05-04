import { createServerComponentClient } from "@/lib/supabase/server-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ApprovalButtons } from "@/components/admin/ApprovalButtons"
import { Suspense } from "react"
import LoadingIndicator from "@/components/ui/loading-indicator"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default function ModerationPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Startup Moderation</h1>
        <div className="flex gap-2">
          <Button variant="destructive" asChild>
            <Link href="/admin/moderation/emergency">
              Emergency Fix
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href="/admin/moderation/test">
              Test Creator
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/moderation/raw">
              View Raw Data
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/moderation/auto-update">
              Auto-Update System
            </Link>
          </Button>
        </div>
      </div>
      <Suspense fallback={<ModerationSkeleton />}>
        <ModerationContent />
      </Suspense>
    </div>
  )
}

async function ModerationContent() {
  // Get the Supabase client
  const supabase = await createServerComponentClient()

  console.log("Fetching ALL startups regardless of status...")
  
  // FETCH ALL STARTUPS - no filtering by status to diagnose the issue
  const { data: allStartups, error: allError } = await supabase
    .from("startups")
    .select(`
      id,
      name,
      slug,
      description,
      categories(name),
      status,
      created_at,
      user_id,
      profiles(full_name, email)
    `)
    .order("created_at", { ascending: false })
    
  console.log("All startups:", allStartups?.map(s => ({ id: s.id, name: s.name, status: s.status })))
  console.log("All startups query error:", allError)
  
  // Manually filter for pending startups on the server side
  const pendingStartups = allStartups?.filter(startup => 
    startup.status === 'pending' || 
    startup.status === 'Pending' || 
    (typeof startup.status === 'string' && startup.status.toLowerCase() === 'pending')
  ) || [];
  
  console.log("Manually filtered pending startups:", pendingStartups?.map(s => ({ id: s.id, name: s.name, status: s.status })))

  // Fetch recently approved/rejected startups
  const { data: recentActionStartups } = await supabase
    .from("startups")
    .select(`
      id,
      name,
      slug,
      categories(name),
      status,
      created_at,
      updated_at,
      profiles(full_name)
    `)
    .in("status", ["approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Startups</CardTitle>
            <CardDescription>
              Review and moderate startups that are waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingStartups && pendingStartups.length > 0 ? (
              <div className="space-y-6">
                {pendingStartups.map((startup) => (
                  <Card key={startup.id} className="overflow-hidden border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{startup.name}</h3>
                            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                              Pending
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {/* Handle potential array structure */}
                            {startup.categories && 'name' in startup.categories 
                              ? startup.categories.name 
                              : Array.isArray(startup.categories) && startup.categories[0] 
                                ? startup.categories[0].name 
                                : ""} • 
                            Submitted by {startup.profiles && 'full_name' in startup.profiles 
                              ? startup.profiles.full_name 
                              : Array.isArray(startup.profiles) && startup.profiles[0]
                                ? startup.profiles[0].full_name
                                : "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(startup.created_at).toLocaleDateString()}
                          </p>
                          <p className="line-clamp-2 text-sm mt-2">
                            {startup.description || "No description provided"}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 self-end">
                          <Link href={`/startups/${startup.slug}`} target="_blank">
                            <Button variant="outline" size="sm">
                              Preview
                            </Button>
                          </Link>
                          <ApprovalButtons startupId={startup.id} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">No pending startups</h3>
                <p className="text-muted-foreground">
                  All startups have been reviewed. Great job!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Recently approved or rejected startups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActionStartups && recentActionStartups.length > 0 ? (
              <div className="space-y-4">
                {recentActionStartups.map((startup) => (
                  <div key={startup.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{startup.name}</h4>
                        {startup.status === "approved" ? (
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            Rejected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {/* Handle potential array structure */}
                        {startup.categories && 'name' in startup.categories 
                          ? startup.categories.name 
                          : Array.isArray(startup.categories) && startup.categories[0] 
                            ? startup.categories[0].name 
                            : ""} • {new Date(startup.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Link href={`/startups/${startup.slug}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p>Pending</p>
                <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30">
                  {pendingStartups?.length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <p>Approved Today</p>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30">
                  {recentActionStartups?.filter(s => 
                    s.status === "approved" && 
                    new Date(s.updated_at).toDateString() === new Date().toDateString()
                  ).length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <p>Rejected Today</p>
                <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30">
                  {recentActionStartups?.filter(s => 
                    s.status === "rejected" && 
                    new Date(s.updated_at).toDateString() === new Date().toDateString()
                  ).length || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ModerationSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </CardHeader>
          <CardContent className="flex justify-center py-16">
            <LoadingIndicator size="lg" />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-4 border-b last:border-0">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          </CardHeader>
          <CardContent className="animate-pulse">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-8"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 