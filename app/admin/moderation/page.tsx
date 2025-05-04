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
import { 
  CheckCircle2, XCircle, Plus, Trash2, AlertCircle, Calendar, 
  User, ListFilter, ShieldAlert, Eye, ExternalLink, Clock, FileText
} from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { motion } from "framer-motion"
import { v4 as uuidv4 } from "uuid"
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import MediaDeleteButton from "@/app/components/MediaDeleteButton"

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
  const [showAllStartups, setShowAllStartups] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedStartup, setSelectedStartup] = useState<any>(null)

  // Fetch all startups on load
  useEffect(() => {
    fetchAllStartups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          user_id,
          logo_url,
          banner_url,
          media_images,
          media_documents,
          media_videos
        `)
        .order("created_at", { ascending: false })
      
      if (error) {
        throw error
      }
      
      console.log("All startups:", data)
      
      // Handle case where data is null or undefined
      const startupData = data || []
      setStartups(startupData)
      
      // Use more robust filtering with normalization for status values
      const pending = startupData.filter(startup => 
        typeof startup.status === 'string' && 
        startup.status.toLowerCase() === 'pending'
      )
      
      const approved = startupData.filter(startup => 
        typeof startup.status === 'string' && 
        startup.status.toLowerCase() === 'approved'
      )
      
      const rejected = startupData.filter(startup => 
        typeof startup.status === 'string' && 
        startup.status.toLowerCase() === 'rejected'
      )
      
      console.log("Pending startups:", pending)
      console.log("Approved startups:", approved)
      console.log("Rejected startups:", rejected)
      
      setPendingStartups(pending)
      setApprovedStartups(approved)
      setRejectedStartups(rejected)
    } catch (err) {
      console.error("Error fetching startups:", err)
      toast({
        title: "Error",
        description: "Failed to load startups. Please try again.",
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
      
      // Call the admin API endpoint instead of direct Supabase update
      const response = await fetch('/api/admin/startups/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          startupId: id, 
          status: approve ? "approved" : "rejected" 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      
      // Find the startup being updated
      const startupToUpdate = startups.find(s => s.id === id)
      if (!startupToUpdate) {
        console.error("Couldn't find startup with ID:", id)
        return
      }
      
      // Create updated startup object
      const updatedStartup = {
        ...startupToUpdate,
        status: approve ? "approved" : "rejected",
        updated_at: new Date().toISOString()
      }
      
      // Update all state arrays
      setStartups(startups.map(s => s.id === id ? updatedStartup : s))
      setPendingStartups(pendingStartups.filter(s => s.id !== id))
      
      if (approve) {
        setApprovedStartups([updatedStartup, ...approvedStartups])
      } else {
        setRejectedStartups([updatedStartup, ...rejectedStartups])
      }
      
      // Close preview if open
      if (previewOpen && selectedStartup?.id === id) {
        setPreviewOpen(false)
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
        description: "There was an error processing your request. Please try again.",
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
        description: "There was an error deleting the startup. Please try again.",
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
        title: "Validation error",
        description: "Please enter a startup name",
        variant: "destructive",
      })
      return
    }
    
    try {
      setCreating(true)
      
      // Generate a dummy user ID if we can't find one
      let userId = null
      
      try {
        // Try to get a user from the profiles table
        const { data: users, error: userError } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
  
        if (!userError && users && users.length > 0) {
          userId = users[0].id
        }
      } catch (err) {
        console.log("Could not fetch user ID, will use a random UUID instead")
      }
      
      // Use random UUID if no user found
      if (!userId) {
        userId = uuidv4()
      }

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
      
      // Refresh all startups to ensure latest data
      await fetchAllStartups()
      
      // Clear form
      setTestName("")
      setTestDescription("")
      
      toast({
        title: "Test startup created",
        description: "New pending startup has been created successfully",
      })
    } catch (err) {
      console.error("Error creating test startup:", err)
      toast({
        title: "Creation failed",
        description: "There was an error creating the test startup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Change startup status - for drag and drop
  async function changeStatus(id: string, newStatus: string) {
    try {
      // Call the admin API endpoint instead of direct Supabase update
      const response = await fetch('/api/admin/startups/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          startupId: id, 
          status: newStatus 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      
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

  // Handle drag end - when a card is dropped into a new column
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the card was dropped back to its original position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Get the new status based on the destination column
    let newStatus;
    switch (destination.droppableId) {
      case 'pending':
        newStatus = 'pending';
        break;
      case 'approved':
        newStatus = 'approved';
        break;
      case 'rejected':
        newStatus = 'rejected';
        break;
      default:
        return;
    }

    // Update the startup's status in the database
    changeStatus(draggableId, newStatus);
  };

  // Function to toggle between Kanban and All Startups view
  const toggleView = () => {
    setShowAllStartups(!showAllStartups);
  };

  // Function to handle startup preview
  function handlePreview(startup: any) {
    setSelectedStartup(startup)
    setPreviewOpen(true)
  }

  // Function to handle media deletion in admin view
  const handleMediaRemoved = (startupId: string, mediaType: string, url: string) => {
    // If the startup is being previewed, update its data
    if (selectedStartup && selectedStartup.id === startupId) {
      const updatedStartup = { ...selectedStartup };
      
      // Update the appropriate field
      switch (mediaType) {
        case "logo":
          updatedStartup.logo_url = null;
          break;
        case "banner":
          updatedStartup.banner_url = null;
          break;
        case "gallery":
        case "image":
          updatedStartup.media_images = (updatedStartup.media_images || [])
            .filter((imgUrl: string) => imgUrl !== url);
          break;
        case "document":
        case "pitch_deck":
          if (mediaType === "pitch_deck") {
            updatedStartup.pitch_deck_url = null;
          }
          updatedStartup.media_documents = (updatedStartup.media_documents || [])
            .filter((docUrl: string) => docUrl !== url);
          break;
        case "video":
          updatedStartup.media_videos = (updatedStartup.media_videos || [])
            .filter((videoUrl: string) => videoUrl !== url);
          break;
      }
      
      setSelectedStartup(updatedStartup);
      
      // Update the startup in the lists
      const updateStartupInList = (list: any[]) => 
        list.map(s => s.id === startupId ? updatedStartup : s);
      
      setStartups(updateStartupInList(startups));
      setPendingStartups(updateStartupInList(pendingStartups));
      setApprovedStartups(updateStartupInList(approvedStartups));
      setRejectedStartups(updateStartupInList(rejectedStartups));
      
      toast({
        title: "Media deleted",
        description: `The ${mediaType} has been removed from this startup.`,
      });
    }
  };

  return (
    <div className="p-6 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Startup Moderation</h1>
          <p className="text-muted-foreground">
            Review and manage startups in the directory
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAllStartups(!showAllStartups)}
          >
            {showAllStartups ? "Hide Approved & Rejected" : "Show All Startups"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/moderation/client-view">
              Client View
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/moderation/spam">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Spam Management
            </Link>
          </Button>
        </div>
      </div>

      {/* Create Test Startup + Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="md:col-span-2 border-2 shadow-md hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> 
              Create Test Startup
            </CardTitle>
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
                  className="border-2 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter startup description"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="border-2 focus:border-primary/50 min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={createTestStartup}
              disabled={creating || !testName}
              className="w-full gap-2"
            >
              {creating ? <LoadingIndicator size="sm" /> : <Plus className="h-4 w-4" />}
              Create Test Startup
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 shadow-md hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                <span className="font-medium">Total Startups</span>
                <Badge variant="outline" className="text-base bg-neutral-200 dark:bg-neutral-700">
                  {startups?.length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                <span className="font-medium text-amber-800 dark:text-amber-300">Pending</span>
                <Badge variant="outline" className="text-base bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  {pendingStartups?.length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                <span className="font-medium text-green-800 dark:text-green-300">Approved</span>
                <Badge variant="outline" className="text-base bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  {approvedStartups?.length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/30 rounded-md">
                <span className="font-medium text-red-800 dark:text-red-300">Rejected</span>
                <Badge variant="outline" className="text-base bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                  {rejectedStartups?.length || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board or All Startups View */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingIndicator size="lg" />
        </div>
      ) : showAllStartups ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">All Startups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((startup) => (
              <Card key={startup.id} className="border-2 hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{startup.name || "Unnamed Startup"}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        ID: {startup.id ? startup.id.substring(0, 8) + '...' : "Unknown"}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`font-medium ${
                        startup.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                        startup.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      }`}
                    >
                      {startup.status ? startup.status.charAt(0).toUpperCase() + startup.status.slice(1) : "Unknown"}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm line-clamp-2 text-neutral-700 dark:text-neutral-300">
                      {startup.description || "No description provided"}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {startup.slug && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/startups/${startup.slug}`} target="_blank">
                          Preview
                        </Link>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-200 hover:bg-red-100 hover:text-red-900 dark:border-red-800/30 dark:hover:bg-red-950/30"
                      onClick={() => handleDelete(startup.id)}
                      disabled={deleting === startup.id}
                    >
                      {deleting === startup.id ? <LoadingIndicator size="sm" /> : <Trash2 className="h-4 w-4 mr-1" />}
                      Delete
                    </Button>
                    
                    {startup.status !== 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => changeStatus(startup.id, 'pending')}
                      >
                        Set as Pending
                      </Button>
                    )}
                    
                    {startup.status !== 'approved' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-green-200 hover:bg-green-100 hover:text-green-900 dark:border-green-800/30 dark:hover:bg-green-950/30"
                        onClick={() => changeStatus(startup.id, 'approved')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    
                    {startup.status !== 'rejected' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 border-red-200 hover:bg-red-100 hover:text-red-900 dark:border-red-800/30 dark:hover:bg-red-950/30"
                        onClick={() => changeStatus(startup.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x">
            {/* Pending Column */}
            <Droppable droppableId="pending" type="COLUMN">
              {(provided) => (
                <div 
                  className="min-w-[350px] w-1/3 snap-start"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-amber-600 dark:text-amber-400 text-lg">Pending</h3>
                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                      {pendingStartups?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-4 p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg min-h-[400px] border-2 border-amber-200 dark:border-amber-800/30">
                    {!pendingStartups || pendingStartups.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-amber-400 dark:text-amber-500 text-center p-6 border-2 border-dashed border-amber-200 dark:border-amber-800/30 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <p className="text-sm mb-2">No pending startups</p>
                        <p className="text-xs text-amber-500/70 dark:text-amber-600/70">All startups have been reviewed</p>
                      </div>
                    ) : (
                      pendingStartups.map((startup, index) => (
                        <Draggable key={startup.id} draggableId={startup.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <StartupCard
                                startup={startup}
                                onApprove={() => handleApproval(startup.id, true)}
                                onReject={() => handleApproval(startup.id, false)}
                                onDelete={() => handleDelete(startup.id)}
                                onPreview={() => handlePreview(startup)}
                                isApproving={approving === startup.id}
                                isDeleting={deleting === startup.id}
                                primary="amber"
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Approved Column */}
            <Droppable droppableId="approved" type="COLUMN">
              {(provided) => (
                <div 
                  className="min-w-[350px] w-1/3 snap-start"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-green-600 dark:text-green-400 text-lg">Approved</h3>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      {approvedStartups?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-4 p-4 bg-green-50/50 dark:bg-green-950/10 rounded-lg min-h-[400px] border-2 border-green-200 dark:border-green-800/30">
                    {!approvedStartups || approvedStartups.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-green-400 dark:text-green-500 text-center p-6 border-2 border-dashed border-green-200 dark:border-green-800/30 rounded-lg bg-green-50 dark:bg-green-950/20">
                        <p className="text-sm mb-2">No approved startups</p>
                        <p className="text-xs text-green-500/70 dark:text-green-600/70">Approve pending startups to see them here</p>
                      </div>
                    ) : (
                      approvedStartups.map((startup, index) => (
                        <Draggable key={startup.id} draggableId={startup.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <StartupCard
                                startup={startup}
                                onDelete={() => handleDelete(startup.id)}
                                onRevert={() => changeStatus(startup.id, 'pending')}
                                onPreview={() => handlePreview(startup)}
                                isDeleting={deleting === startup.id}
                                primary="green"
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            {/* Rejected Column */}
            <Droppable droppableId="rejected" type="COLUMN">
              {(provided) => (
                <div 
                  className="min-w-[350px] w-1/3 snap-start"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-red-600 dark:text-red-400 text-lg">Rejected</h3>
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                      {rejectedStartups?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-4 p-4 bg-red-50/50 dark:bg-red-950/10 rounded-lg min-h-[400px] border-2 border-red-200 dark:border-red-800/30">
                    {!rejectedStartups || rejectedStartups.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-red-400 dark:text-red-500 text-center p-6 border-2 border-dashed border-red-200 dark:border-red-800/30 rounded-lg bg-red-50 dark:bg-red-950/20">
                        <p className="text-sm mb-2">No rejected startups</p>
                        <p className="text-xs text-red-500/70 dark:text-red-600/70">Rejected startups will appear here</p>
                      </div>
                    ) : (
                      rejectedStartups.map((startup, index) => (
                        <Draggable key={startup.id} draggableId={startup.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <StartupCard
                                startup={startup}
                                onDelete={() => handleDelete(startup.id)}
                                onRevert={() => changeStatus(startup.id, 'pending')}
                                onPreview={() => handlePreview(startup)}
                                isDeleting={deleting === startup.id}
                                primary="red"
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      )}

      {/* Startup Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Startup Preview
            </DialogTitle>
            <DialogDescription>
              Reviewing startup details before making a moderation decision
            </DialogDescription>
          </DialogHeader>

          {selectedStartup && (
            <div className="space-y-4">
              {/* Startup header with name and logo */}
              <div className="flex items-center gap-4">
                {selectedStartup.logo_url ? (
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
                    <img 
                      src={selectedStartup.logo_url} 
                      alt={`${selectedStartup.name} logo`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-1 right-1">
                      <MediaDeleteButton
                        startupId={selectedStartup.id}
                        mediaType="logo"
                        mediaUrl={selectedStartup.logo_url}
                        isAdmin={true}
                        size="icon"
                        variant="outline"
                        onDelete={() => handleMediaRemoved(selectedStartup.id, "logo", selectedStartup.logo_url)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">{selectedStartup.name}</h2>
                  <p className="text-muted-foreground text-sm">ID: {selectedStartup.id}</p>
                </div>
              </div>

              {/* Banner image if available */}
              {selectedStartup.banner_url && (
                <div className="relative w-full h-40 rounded-md overflow-hidden">
                  <img 
                    src={selectedStartup.banner_url} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <MediaDeleteButton
                      startupId={selectedStartup.id}
                      mediaType="banner"
                      mediaUrl={selectedStartup.banner_url}
                      isAdmin={true}
                      size="sm"
                      variant="outline"
                      onDelete={() => handleMediaRemoved(selectedStartup.id, "banner", selectedStartup.banner_url)}
                    />
                  </div>
                </div>
              )}

              {/* Basic info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <p className="mt-1 text-sm">{selectedStartup.description || "No description provided"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Badge className="mt-1" variant={
                        selectedStartup.status === "approved" ? "default" :
                        selectedStartup.status === "rejected" ? "destructive" : "outline"
                      }>
                        {selectedStartup.status || "Unknown"}
                      </Badge>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="mt-1 text-sm">{new Date(selectedStartup.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gallery Images */}
              {selectedStartup.media_images && selectedStartup.media_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gallery Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedStartup.media_images.map((imageUrl: string, index: number) => (
                        <div key={`gallery-${index}`} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                          <img 
                            src={imageUrl} 
                            alt={`Gallery image ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 right-1">
                            <MediaDeleteButton
                              startupId={selectedStartup.id}
                              mediaType="gallery"
                              mediaUrl={imageUrl}
                              isAdmin={true}
                              size="icon"
                              variant="outline"
                              onDelete={() => handleMediaRemoved(selectedStartup.id, "gallery", imageUrl)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {selectedStartup.media_documents && selectedStartup.media_documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedStartup.media_documents.map((docUrl: string, index: number) => (
                        <div key={`doc-${index}`} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <a 
                              href={docUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Document {index + 1}
                            </a>
                          </div>
                          <MediaDeleteButton
                            startupId={selectedStartup.id}
                            mediaType="document"
                            mediaUrl={docUrl}
                            isAdmin={true}
                            size="sm"
                            onDelete={() => handleMediaRemoved(selectedStartup.id, "document", docUrl)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Videos */}
              {selectedStartup.media_videos && selectedStartup.media_videos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedStartup.media_videos.map((videoUrl: string, index: number) => (
                        <div key={`video-${index}`} className="relative">
                          <div className="aspect-video bg-muted rounded-md overflow-hidden">
                            {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                              <iframe
                                src={videoUrl.replace('watch?v=', 'embed/')}
                                title={`Video ${index + 1}`}
                                className="w-full h-full"
                                allowFullScreen
                              ></iframe>
                            ) : (
                              <video
                                src={videoUrl}
                                controls
                                className="w-full h-full object-contain"
                              ></video>
                            )}
                          </div>
                          <div className="absolute top-2 right-2">
                            <MediaDeleteButton
                              startupId={selectedStartup.id}
                              mediaType="video"
                              mediaUrl={videoUrl}
                              isAdmin={true}
                              size="sm"
                              variant="outline"
                              onDelete={() => handleMediaRemoved(selectedStartup.id, "video", videoUrl)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button
                  variant="default"
                  onClick={() => window.open(`/dashboard/startups/${selectedStartup.id}`, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Startup
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleApproval(selectedStartup.id, false);
                      setPreviewOpen(false);
                    }}
                    disabled={approving === selectedStartup.id}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      handleApproval(selectedStartup.id, true);
                      setPreviewOpen(false);
                    }}
                    disabled={approving === selectedStartup.id}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Replace StartupCard component with this improved version
interface StartupCardProps {
  startup: any;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete: () => void;
  onRevert?: () => void;
  onPreview?: () => void; // Add preview function
  isApproving?: boolean;
  isDeleting?: boolean;
  primary: 'amber' | 'green' | 'red';
  isDragging?: boolean;
}

function StartupCard({ 
  startup, 
  onApprove, 
  onReject, 
  onDelete, 
  onRevert,
  onPreview,
  isApproving, 
  isDeleting,
  primary,
  isDragging
}: StartupCardProps) {
  const colorClasses = {
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800/30',
      text: 'text-amber-800 dark:text-amber-300',
      badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800/30',
      text: 'text-green-800 dark:text-green-300',
      badge: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800/30',
      text: 'text-red-800 dark:text-red-300',
      badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
    }
  };

  const isPending = primary === 'amber';
  const colors = colorClasses[primary];

  // Get creator information
  const creatorName = startup.profiles?.full_name || "Unknown User";
  const creatorEmail = startup.profiles?.email;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border-2 ${colors.border} ${colors.bg} ${isDragging ? 'shadow-xl' : 'shadow-sm hover:shadow-md'} transition-all duration-300 overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
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
              <h3 className="font-bold text-lg leading-tight">{startup.name || "Unnamed Startup"}</h3>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{creatorName}</span>
                {creatorEmail && (
                  <span className="hidden md:inline text-neutral-400">({creatorEmail})</span>
                )}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={`${colors.badge} font-medium`}>
            {primary.charAt(0).toUpperCase() + primary.slice(1)}
          </Badge>
        </div>
        
        <div className="mb-3">
          <p className="text-sm line-clamp-2 text-neutral-700 dark:text-neutral-300">
            {startup.description || "No description provided"}
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {startup.created_at ? new Date(startup.created_at).toLocaleString() : "Unknown date"}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {/* Preview Button (always show) */}
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          
          {startup.slug && (
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="flex-1"
            >
              <Link href={`/startups/${startup.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          )}
          
          {isPending && onApprove && onReject && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-red-200 hover:bg-red-100 hover:text-red-900 dark:border-red-800/30 dark:hover:bg-red-950/30"
                onClick={onReject}
                disabled={isApproving}
              >
                {isApproving ? <LoadingIndicator size="sm" /> : <XCircle className="h-4 w-4 mr-1" />}
                Reject
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-green-200 hover:bg-green-100 hover:text-green-900 dark:border-green-800/30 dark:hover:bg-green-950/30"
                onClick={onApprove}
                disabled={isApproving}
              >
                {isApproving ? <LoadingIndicator size="sm" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Approve
              </Button>
            </>
          )}
          
          {!isPending && onRevert && (
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={onRevert}
            >
              Set as Pending
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-red-200 hover:bg-red-100 hover:text-red-900 dark:border-red-800/30 dark:hover:bg-red-950/30"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <LoadingIndicator size="sm" /> : <Trash2 className="h-4 w-4 mr-1" />}
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 