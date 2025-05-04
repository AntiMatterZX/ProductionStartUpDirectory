"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { CheckCircle2, XCircle, Plus, Trash2, AlertCircle } from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { v4 as uuidv4 } from "uuid"

// Force client-side rendering to ensure fresh data
export default function ModerationPage() {
  const [loading, setLoading] = useState(true)
  const [startups, setStartups] = useState<any[]>([])
  const [pendingStartups, setPendingStartups] = useState<any[]>([])
  const [approvedStartups, setApprovedStartups] = useState<any[]>([])
  const [rejectedStartups, setRejectedStartups] = useState<any[]>([])
  const [approving, setApproving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [testName, setTestName] = useState("")
  const [testDescription, setTestDescription] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Fetch all startups on load
  useEffect(() => {
    fetchAllStartups()
  }, [])

  // Fetch all startups
  async function fetchAllStartups() {
    try {
      setLoading(true)
      console.log("Fetching all startups...")
      
      const { data, error } = await supabase
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
      
      if (error) throw error
      
      console.log("All startups:", data)
      setStartups(data || [])
      
      // Separate into different status categories
      const pending = data?.filter(startup => 
        startup.status === 'pending' || 
        startup.status === 'Pending' || 
        (typeof startup.status === 'string' && startup.status.toLowerCase() === 'pending')
      ) || []
      
      const approved = data?.filter(startup => 
        startup.status === 'approved'
      ) || []
      
      const rejected = data?.filter(startup => 
        startup.status === 'rejected'
      ) || []
      
      console.log("Pending startups:", pending)
      setPendingStartups(pending)
      setApprovedStartups(approved)
      setRejectedStartups(rejected)
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
      
      // Find the startup that was updated
      const updatedStartup = startups.find(s => s.id === id)
      
      if (updatedStartup) {
        // Update local state
        updatedStartup.status = approve ? "approved" : "rejected"
        updatedStartup.updated_at = new Date().toISOString()
        
        setStartups([...startups])
        setPendingStartups(pendingStartups.filter(s => s.id !== id))
        
        if (approve) {
          setApprovedStartups([updatedStartup, ...approvedStartups])
        } else {
          setRejectedStartups([updatedStartup, ...rejectedStartups])
        }
      }
      
      toast({
        title: approve ? "Startup approved" : "Startup rejected",
        description: approve 
          ? "The startup has been approved and is now public" 
          : "The startup has been rejected",
        variant: approve ? "default" : "destructive",
      })
    } catch (err) {
      console.error("Error approving/rejecting startup:", err)
      toast({
        title: "Action failed",
        description: "There was an error processing your request",
        variant: "destructive",
      })
    } finally {
      setApproving(null)
    }
  }

  // Delete a startup
  async function handleDelete(id: string) {
    try {
      setDeleting(id)
      
      const { error } = await supabase
        .from("startups")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      
      // Update all state arrays
      setStartups(startups.filter(s => s.id !== id))
      setPendingStartups(pendingStartups.filter(s => s.id !== id))
      setApprovedStartups(approvedStartups.filter(s => s.id !== id))
      setRejectedStartups(rejectedStartups.filter(s => s.id !== id))
      
      toast({
        title: "Startup deleted",
        description: "The startup has been permanently deleted",
      })
    } catch (err) {
      console.error("Error deleting startup:", err)
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the startup",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  // Create a test startup
  async function createTestStartup() {
    if (!testName) {
      toast({
        title: "Error",
        description: "Please enter a startup name",
        variant: "destructive",
      })
      return
    }
    
    try {
      setCreating(true)
      
      // Get first user for user_id
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)

      if (userError) throw userError
      if (!users || users.length === 0) {
        throw new Error("No users found")
      }

      const userId = users[0].id
      const testId = Math.floor(Math.random() * 10000)
      const now = new Date().toISOString()
      const slug = `${testName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${testId}`
      
      // Insert test startup
      const { data, error } = await supabase
        .from("startups")
        .insert({
          id: uuidv4(),
          name: testName,
          slug: slug,
          description: testDescription || `Test description for ${testName}`,
          status: "pending", // Always lowercase "pending"
          user_id: userId,
          created_at: now,
          updated_at: now
        })
        .select()

      if (error) throw error
      
      toast({
        title: "Test startup created",
        description: "New pending startup has been created successfully",
      })
      
      // Clear form
      setTestName("")
      setTestDescription("")
      
      // Refresh all startups
      fetchAllStartups()
      
    } catch (err) {
      console.error("Error creating test startup:", err)
      toast({
        title: "Creation failed",
        description: "There was an error creating the test startup",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Change startup status
  async function changeStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("startups")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
      
      if (error) throw error
      
      // Refresh all startups
      fetchAllStartups()
      
      toast({
        title: "Status updated",
        description: `Status changed to "${newStatus}"`,
      })
    } catch (err) {
      console.error("Error changing status:", err)
      toast({
        title: "Update failed",
        description: "There was an error changing the status",
        variant: "destructive",
      })
    }
  }

  // Render startup card
  function StartupCard({ startup, showActions = true }: { startup: any, showActions?: boolean }) {
    const isPending = startup.status === 'pending' || 
      startup.status === 'Pending' || 
      (typeof startup.status === 'string' && startup.status.toLowerCase() === 'pending')
    
    return (
      <Card key={startup.id} className={`overflow-hidden ${
        isPending ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20' :
        startup.status === 'approved' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' :
        startup.status === 'rejected' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' :
        ''
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{startup.name}</h3>
                <Badge variant="outline" className={`
                  ${isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                  startup.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                  startup.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                  'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'}
                `}>
                  {startup.status || "Unknown"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                ID: {startup.id}
              </p>
              <p className="text-sm text-muted-foreground">
                Submitted by: {startup.profiles?.full_name || "Unknown"}
                {startup.profiles?.email && ` (${startup.profiles.email})`}
              </p>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(startup.created_at).toLocaleString()}
              </p>
              <p className="line-clamp-2 text-sm mt-2">
                {startup.description || "No description provided"}
              </p>
            </div>
            
            {showActions && (
              <div className="flex flex-col gap-2 self-end">
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
                  
                  {isPending && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-200 hover:bg-red-100 hover:text-red-900"
                        onClick={() => handleApproval(startup.id, false)}
                        disabled={approving === startup.id}
                      >
                        {approving === startup.id ? <LoadingIndicator size="sm" /> : <XCircle className="h-4 w-4 mr-1" />}
                        Reject
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-green-200 hover:bg-green-100 hover:text-green-900"
                        onClick={() => handleApproval(startup.id, true)}
                        disabled={approving === startup.id}
                      >
                        {approving === startup.id ? <LoadingIndicator size="sm" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                        Approve
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex gap-2 mt-2">
                  {!isPending && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => changeStatus(startup.id, 'pending')}
                    >
                      Set as Pending
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-200 hover:bg-red-100 hover:text-red-900"
                    onClick={() => handleDelete(startup.id)}
                    disabled={deleting === startup.id}
                  >
                    {deleting === startup.id ? <LoadingIndicator size="sm" /> : <Trash2 className="h-4 w-4 mr-1" />}
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Startup Moderation</h1>
          <p className="text-muted-foreground">
            Manage all startups in one place
          </p>
        </div>
        <Button 
          variant="default" 
          onClick={fetchAllStartups}
          disabled={loading}
        >
          {loading ? <LoadingIndicator size="sm" className="mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Create Test Startup</CardTitle>
            <CardDescription>
              Create a startup with "pending" status for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Startup Name</Label>
                <Input
                  id="name"
                  placeholder="Enter test startup name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter startup description"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createTestStartup}
              disabled={creating || !testName}
              className="w-full"
            >
              {creating ? <LoadingIndicator size="sm" className="mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Test Startup
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Startups</span>
                <Badge variant="outline" className="text-base">
                  {startups.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Pending Approval</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 text-base">
                  {pendingStartups.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Approved</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 text-base">
                  {approvedStartups.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Rejected</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 text-base">
                  {rejectedStartups.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="pending">
            Pending ({pendingStartups.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedStartups.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedStartups.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Startups ({startups.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
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
            <div className="space-y-4">
              {pendingStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingIndicator size="lg" />
            </div>
          ) : approvedStartups.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">No approved startups</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingIndicator size="lg" />
            </div>
          ) : rejectedStartups.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">No rejected startups</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rejectedStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingIndicator size="lg" />
            </div>
          ) : startups.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">No startups found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {startups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 