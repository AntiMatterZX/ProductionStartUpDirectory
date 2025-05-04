"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Button } from "@/components/ui/button"
import { PlusIcon, ListFilter } from "lucide-react"
import StartupCard from "@/components/startup/cards/StartupCard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function StartupsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [startups, setStartups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showKanban, setShowKanban] = useState(true)
  
  // Filtered startups for Kanban
  const pendingStartups = startups.filter(s => s.status === "pending")
  const approvedStartups = startups.filter(s => s.status === "approved")
  const rejectedStartups = startups.filter(s => s.status === "rejected")
  
  useEffect(() => {
    fetchStartups()
  }, [])
  
  const fetchStartups = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/login?redirect=/dashboard/startups")
        return
      }
      
      // Fetch user's startups with better error handling
      const { data, error } = await supabase
        .from("startups")
        .select(`
          *,
          categories(id, name)
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
      
      if (error) {
        console.error("Error fetching startups:", error)
        setError("Failed to load startups. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load startups. Please try again.",
          variant: "destructive",
        })
      } else {
        setStartups(data || [])
      }
    } catch (err) {
      console.error("Error in fetchStartups:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  const toggleView = () => {
    setShowKanban(!showKanban)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )
    }
    
    if (error) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Error Loading Startups</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchStartups}>
            Try Again
          </Button>
        </div>
      )
    }
    
    if (startups.length === 0) {
      return (
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
      )
    }
    
    if (showKanban) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
              <h3 className="font-medium text-amber-800 dark:text-amber-300">Pending ({pendingStartups.length})</h3>
            </div>
            <div className="space-y-4">
              {pendingStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
              {pendingStartups.length === 0 && (
                <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                  No pending startups
                </div>
              )}
            </div>
          </div>
          
          {/* Approved Column */}
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
              <h3 className="font-medium text-green-800 dark:text-green-300">Approved ({approvedStartups.length})</h3>
            </div>
            <div className="space-y-4">
              {approvedStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
              {approvedStartups.length === 0 && (
                <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                  No approved startups
                </div>
              )}
            </div>
          </div>
          
          {/* Rejected Column */}
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
              <h3 className="font-medium text-red-800 dark:text-red-300">Rejected ({rejectedStartups.length})</h3>
            </div>
            <div className="space-y-4">
              {rejectedStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
              {rejectedStartups.length === 0 && (
                <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                  No rejected startups
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
    
    // Regular Grid View
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.map((startup) => (
          <StartupCard key={startup.id} startup={startup} />
        ))}
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">My Startups</h1>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={toggleView}
            className="gap-2 w-full md:w-auto"
          >
            <ListFilter className="h-4 w-4" />
            {showKanban ? "Grid View" : "Kanban Board"}
          </Button>
          <Link href="/dashboard/startups/create" className="w-full md:w-auto">
            <Button className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Startup
            </Button>
          </Link>
        </div>
      </div>

      {renderContent()}
    </div>
  )
}
