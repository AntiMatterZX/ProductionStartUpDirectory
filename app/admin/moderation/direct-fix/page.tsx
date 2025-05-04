"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import LoadingIndicator from "@/components/ui/loading-indicator"

export default function DirectFixPage() {
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [startups, setStartups] = useState<any[]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Fetch all startups
  useEffect(() => {
    async function fetchAllStartups() {
      try {
        setLoading(true)
        // Get ALL startups with no filters
        const { data, error } = await supabase
          .from("startups")
          .select("id, name, slug, description, status, created_at, updated_at")
          .order("created_at", { ascending: false })

        if (error) throw error
        
        console.log("All startups:", data)
        setStartups(data || [])
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

    fetchAllStartups()
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
      setStartups(startups.map(s => 
        s.id === id ? { ...s, status: approve ? "approved" : "rejected" } : s
      ))
      
      toast({
        title: approve ? "Startup approved" : "Startup rejected",
        description: approve 
          ? "The startup has been approved and is now public." 
          : "The startup has been rejected.",
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Direct Fix - All Startups</h1>
          <p className="text-muted-foreground">
            Directly manage all startups in the system
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/moderation">
            Back to Moderation
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Startups ({startups.length})</CardTitle>
          <CardDescription>
            Complete list of all startups and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingIndicator size="lg" />
            </div>
          ) : startups.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No startups found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* First show pending startups */}
              {startups
                .filter(s => s.status === "pending" || s.status === "Pending" || 
                  (typeof s.status === "string" && s.status.toLowerCase() === "pending"))
                .map(startup => (
                  <Card key={startup.id} className="overflow-hidden border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{startup.name}</h3>
                            <Badge className="bg-amber-100 text-amber-800">
                              Pending
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {startup.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(startup.created_at).toLocaleDateString()}
                          </p>
                          <p className="line-clamp-2 text-sm mt-2">
                            {startup.description || "No description provided"}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 self-end items-center">
                          <p className="text-xs text-muted-foreground mr-2">Original status: "{startup.status}"</p>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-200 hover:bg-red-100"
                              onClick={() => handleApproval(startup.id, false)}
                              disabled={approving === startup.id}
                            >
                              {approving === startup.id ? <LoadingIndicator size="sm" /> : "Reject"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-green-200 hover:bg-green-100"
                              onClick={() => handleApproval(startup.id, true)}
                              disabled={approving === startup.id}
                            >
                              {approving === startup.id ? <LoadingIndicator size="sm" /> : "Approve"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
              {/* Then show non-pending startups */}
              {startups
                .filter(s => s.status !== "pending" && s.status !== "Pending" && 
                  !(typeof s.status === "string" && s.status.toLowerCase() === "pending"))
                .map(startup => (
                  <Card key={startup.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{startup.name}</h3>
                            <Badge variant={
                              startup.status === "approved" ? "outline" :
                              startup.status === "rejected" ? "destructive" : 
                              "secondary"
                            }>
                              {startup.status || "No status"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {startup.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(startup.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 self-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const { error } = supabase
                                .from("startups")
                                .update({ 
                                  status: "pending",
                                  updated_at: new Date().toISOString()
                                })
                                .eq("id", startup.id)
                                .then(({ error }) => {
                                  if (!error) {
                                    setStartups(startups.map(s => 
                                      s.id === startup.id ? { ...s, status: "pending" } : s
                                    ))
                                    toast({ 
                                      title: "Status updated", 
                                      description: "Startup status set to pending"
                                    })
                                  }
                                })
                            }}
                          >
                            Set as Pending
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
  )
} 