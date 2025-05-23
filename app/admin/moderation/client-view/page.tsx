"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Eye, Calendar, User, AlertCircle, Clock, ExternalLink } from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ClientModerationPage() {
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [pendingStartups, setPendingStartups] = useState<any[]>([])
  const [recentStartups, setRecentStartups] = useState<any[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedStartup, setSelectedStartup] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Fetch pending startups
  useEffect(() => {
    fetchStartups()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch startups function
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
          logo_url,
          user_id,
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
      
      // Find the startup being updated
      const updatedStartup = pendingStartups.find(s => s.id === id)
      if (!updatedStartup) {
        console.error("Couldn't find startup with ID:", id)
        return
      }
      
      // Update the startup status
      updatedStartup.status = approve ? "approved" : "rejected";
      updatedStartup.updated_at = new Date().toISOString();
      
      // Update local state to reflect the change
      setPendingStartups(pendingStartups.filter(s => s.id !== id))
      
      // Add to recent startups - ensuring we don't exceed 5 items
      setRecentStartups([updatedStartup, ...recentStartups.slice(0, 4)])
      
      // Close preview if open
      if (previewOpen && selectedStartup?.id === id) {
        setPreviewOpen(false)
      }
      
      toast({
        title: approve ? "Startup approved" : "Startup rejected",
        description: approve 
          ? "The startup has been approved and is now public." 
          : "The startup has been rejected.",
        variant: approve ? "default" : "destructive",
      })
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

  // Preview startup details
  function handlePreview(startup: any) {
    setSelectedStartup(startup)
    setPreviewOpen(true)
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
          <Button onClick={fetchStartups} variant="outline" className="gap-1">
            <LoadingIndicator size="sm" className={loading ? "opacity-100" : "opacity-0"} />
            Refresh
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/moderation">
              Main Dashboard
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
                              {startup.logo_url && (
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                  <img 
                                    src={startup.logo_url} 
                                    alt={`${startup.name} logo`} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <h3 className="font-bold text-lg">{startup.name}</h3>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{startup.profiles?.full_name || "Unknown User"}</span>
                                  {startup.profiles?.email && (
                                    <span className="text-muted-foreground/70 hidden md:inline">
                                      ({startup.profiles.email})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge className="bg-amber-100 text-amber-800 ml-2">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Created: {new Date(startup.created_at).toLocaleDateString()}
                            </p>
                            <p className="line-clamp-2 text-sm mt-2">
                              {startup.description || "No description provided"}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 self-end items-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePreview(startup)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            
                            {startup.slug && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                              >
                                <Link href={`/startups/${startup.slug}`} target="_blank">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
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
                          {startup.logo_url && (
                            <div className="h-6 w-6 rounded-full overflow-hidden border border-gray-200">
                              <img 
                                src={startup.logo_url} 
                                alt={`${startup.name} logo`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
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
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePreview(startup)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        
                        {startup.slug && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/startups/${startup.slug}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Startup Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedStartup?.name || "Startup Preview"}</DialogTitle>
            <DialogDescription>
              Review startup details before making a decision
            </DialogDescription>
          </DialogHeader>
          
          {selectedStartup && (
            <div className="mt-4 space-y-6">
              {/* Status Badge */}
              <div className="flex flex-wrap gap-2">
                <Badge className={`${
                  selectedStartup.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  selectedStartup.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedStartup.status?.charAt(0).toUpperCase() + selectedStartup.status?.slice(1) || "Unknown"}
                </Badge>
                
                {selectedStartup.slug && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>Slug:</span> {selectedStartup.slug}
                  </Badge>
                )}
              </div>
              
              {/* User Info */}
              {selectedStartup.profiles && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Submitter Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Name:</span> {selectedStartup.profiles.full_name || "Unknown"}
                    </p>
                    {selectedStartup.profiles.email && (
                      <p>
                        <span className="font-medium">Email:</span> {selectedStartup.profiles.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{new Date(selectedStartup.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{new Date(selectedStartup.updated_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                  <p className="text-sm font-mono">{selectedStartup.user_id || "Unknown"}</p>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Startup ID</h3>
                  <p className="text-sm font-mono">{selectedStartup.id}</p>
                </div>
              </div>
              
              {/* Logo Preview */}
              {selectedStartup.logo_url && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Logo</h3>
                  <div className="w-20 h-20 rounded-lg overflow-hidden border">
                    <img 
                      src={selectedStartup.logo_url} 
                      alt={`${selectedStartup.name} logo`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <div className="p-4 bg-muted/20 rounded-md max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedStartup.description || "No description provided"}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
            <div>
              {selectedStartup?.slug && (
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <Link href={`/startups/${selectedStartup.slug}`} target="_blank">
                    Preview on Site
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
            
            {selectedStartup?.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-200 hover:bg-red-100 hover:text-red-900"
                  onClick={() => {
                    if (selectedStartup) {
                      handleApproval(selectedStartup.id, false);
                    }
                  }}
                  disabled={approving === selectedStartup?.id}
                >
                  {approving === selectedStartup?.id ? <LoadingIndicator size="sm" /> : <XCircle className="h-4 w-4 mr-1" />}
                  Reject Startup
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-200 hover:bg-green-100 hover:text-green-900"
                  onClick={() => {
                    if (selectedStartup) {
                      handleApproval(selectedStartup.id, true);
                    }
                  }}
                  disabled={approving === selectedStartup?.id}
                >
                  {approving === selectedStartup?.id ? <LoadingIndicator size="sm" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Approve Startup
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 