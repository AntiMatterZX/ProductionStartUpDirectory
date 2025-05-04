"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"

export default function ClientModerationPage() {
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [pendingStartups, setPendingStartups] = useState<any[]>([])
  const [recentStartups, setRecentStartups] = useState<any[]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Fetch pending startups
  useEffect(() => {
    async function fetchStartups() {
      try {
        setLoading(true)
        console.log("Fetching startups from client...")
        
        // First try to get all startups to make debugging easier
        const { data: allStartups, error: allError } = await supabase
          .from("startups")
          .select(`
            id,
            name,
            slug,
            description,
            status,
            created_at,
            updated_at,
            profiles(full_name, email)
          `)
          .order("created_at", { ascending: false })
        
        if (allError) throw allError
        
        console.log("All startups:", allStartups)
        
        // Manually filter for pending startups
        const pending = allStartups?.filter(startup => 
          startup.status === 'pending' || 
          startup.status === 'Pending' || 
          (typeof startup.status === 'string' && startup.status.toLowerCase() === 'pending')
        ) || []
        
        console.log("Filtered pending startups:", pending)
        setPendingStartups(pending)
        
        // Get recent approved/rejected startups
        const recent = allStartups?.filter(startup => 
          startup.status === 'approved' || startup.status === 'rejected'
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5) || []
        
        setRecentStartups(recent)
      } catch (err) {
        console.error("Error fetching startups:", err)
        toast({
          title: "Error",
          description: "Failed to load startups",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStartups()
  }, [supabase, toast])

  // Handle approval/rejection
  async function handleApproval(id: string, approve: boolean) {
    try {
      setApproving(id)
      
      const { error } = await supabase
        .from("startups")
        .update({ 
          status: approve ? "approved" : "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
      
      if (error) throw error
      
      // Update local state to reflect the change
      setPendingStartups(pendingStartups.filter(s => s.id !== id))
      
      // Add to recent startups
      const updatedStartup = pendingStartups.find(s => s.id === id)
      if (updatedStartup) {
        updatedStartup.status = approve ? "approved" : "rejected"
        updatedStartup.updated_at = new Date().toISOString()
        setRecentStartups([updatedStartup, ...recentStartups.slice(0, 4)])
      }
      
      toast({
        title: approve ? "Startup approved" : "Startup rejected",
        description: approve 
          ? "The startup has been approved and is now public." 
          : "The startup has been rejected.",
        variant: approve ? "default" : "destructive",
      })
      
      router.refresh()
    } catch (err) {
      console.error("Error updating startup:", err)
      toast({
        title: "Action failed",
        description: "There was an error processing your request.",
        variant: "destructive",
      })
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Client-Side Moderation</h1>
          <p className="text-muted-foreground">
            Alternative view for reviewing pending startups
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/moderation">
              Server View
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/moderation/direct-fix">
              All Startups
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/moderation/spam">
              Spam Management
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending Startups ({pendingStartups.length})</CardTitle>
              <CardDescription>
                Review and moderate startups that are waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <LoadingIndicator size="lg" />
                </div>
              ) : pendingStartups.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">No pending startups</h3>
                  <p className="text-muted-foreground">
                    All startups have been reviewed. Great job!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingStartups.map((startup) => (
                    <Card key={startup.id} className="overflow-hidden border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{startup.name}</h3>
                              <Badge className="bg-amber-100 text-amber-800">
                                Pending {startup.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Submitted by {startup.profiles?.full_name || "Unknown"} 
                              {startup.profiles?.email && ` (${startup.profiles.email})`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(startup.created_at).toLocaleDateString()}
                            </p>
                            <p className="line-clamp-2 text-sm mt-2">
                              {startup.description || "No description provided"}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 self-end items-center">
                            <div className="flex gap-2">
                              {startup.slug && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/startups/${startup.slug}`} target="_blank">
                                    Preview
                                  </Link>
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-red-200 hover:bg-red-100"
                                onClick={() => handleApproval(startup.id, false)}
                                disabled={approving === startup.id}
                              >
                                {approving === startup.id ? <LoadingIndicator size="sm" /> : <XCircle className="h-4 w-4 mr-1" />}
                                Reject
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-green-200 hover:bg-green-100"
                                onClick={() => handleApproval(startup.id, true)}
                                disabled={approving === startup.id}
                              >
                                {approving === startup.id ? <LoadingIndicator size="sm" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
              {recentStartups.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {recentStartups.map((startup) => (
                    <div key={startup.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{startup.name}</h4>
                          {startup.status === "approved" ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              Rejected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(startup.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {startup.slug && (
                        <Link href={`/startups/${startup.slug}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 