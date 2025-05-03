import { createServerComponentClient } from "@/lib/supabase/server-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { ApprovalButtons } from "@/components/admin/ApprovalButtons"
import { RefreshButton } from "@/components/admin/RefreshButton"

// Define the startup type for better type checking
interface Startup {
  id: string
  name: string
  slug: string
  description?: string
  categories: { name: string } | Array<{ name: string }>
  status: string
  created_at: string
  updated_at?: string
  user_id?: string
  profiles?: { full_name: string, email?: string } | Array<{ full_name: string, email?: string }>
}

export default async function ModerationPage() {
  // Get the Supabase client
  const supabase = await createServerComponentClient()
  
  let pendingStartups: Startup[] = [];
  let pendingError: Error | null = null;
  
  try {
    // Fetch pending startups - using a more inclusive approach
    const { data, error } = await supabase
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
      .or('status.eq.pending,status.eq.PENDING')
      .order("created_at", { ascending: false })
    
    if (error) throw new Error(error.message);
    pendingStartups = data || [];
    
    // Log for debugging
    console.log(`Found ${pendingStartups.length} pending startups`);
  } catch (err) {
    console.error("Error fetching pending startups:", err);
    pendingError = err instanceof Error ? err : new Error('Unknown error occurred');
  }

  // Fetch recently approved/rejected startups
  let recentActionStartups: Startup[] = [];
  let recentError: Error | null = null;
  
  try {
    const { data, error } = await supabase
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
      .or('status.eq.approved,status.eq.rejected,status.eq.APPROVED,status.eq.REJECTED')
      .order("updated_at", { ascending: false })
      .limit(5)
      
    if (error) throw new Error(error.message);
    recentActionStartups = data || [];
  } catch (err) {
    console.error("Error fetching recent actions:", err);
    recentError = err instanceof Error ? err : new Error('Unknown error occurred');
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Startup Moderation</h1>

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
              {pendingError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch pending startups: {pendingError.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {!pendingError && pendingStartups && pendingStartups.length > 0 ? (
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
                  <p className="text-muted-foreground mb-4">
                    No startups are currently pending review.
                  </p>
                  
                  <div className="flex justify-center gap-4">
                    <RefreshButton />
                  </div>
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
              {recentError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch recent activity: {recentError.message}
                  </AlertDescription>
                </Alert>
              )}
            
              {!recentError && recentActionStartups && recentActionStartups.length > 0 ? (
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
                              : ""} • {startup.updated_at ? new Date(startup.updated_at).toLocaleDateString() : "No date"}
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
                      s.updated_at && new Date(s.updated_at).toDateString() === new Date().toDateString()
                    ).length || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <p>Rejected Today</p>
                  <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30">
                    {recentActionStartups?.filter(s => 
                      s.status === "rejected" && 
                      s.updated_at && new Date(s.updated_at).toDateString() === new Date().toDateString()
                    ).length || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 