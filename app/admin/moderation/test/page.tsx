"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { Badge } from "@/components/ui/badge"
import { v4 as uuidv4 } from "uuid"

export default function TestStartupPage() {
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [startups, setStartups] = useState<any[]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Fetch all test startups
  useEffect(() => {
    async function fetchTestStartups() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("startups")
          .select("id, name, status, created_at")
          .or("status.eq.pending,name.ilike.%Test%,name.ilike.%EMERGENCY%")
          .order("created_at", { ascending: false })

        if (error) throw error
        setStartups(data || [])
      } catch (err) {
        console.error("Error fetching test startups:", err)
        toast({
          title: "Error",
          description: "Failed to load test startups",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTestStartups()
  }, [supabase, toast])

  // Create a new test startup
  async function createTestStartup() {
    try {
      setCreating(true)
      
      // Get first user
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
      
      // Insert test startup
      const { data, error } = await supabase
        .from("startups")
        .insert({
          id: uuidv4(),
          name: `DIRECT TEST ${testId}`,
          slug: `direct-test-${testId}`,
          description: "This is a direct test startup created from the test page",
          status: "pending",
          user_id: userId,
          created_at: now,
          updated_at: now
        })
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Test startup created successfully",
      })

      // Refresh startup list
      const { data: refreshedData } = await supabase
        .from("startups")
        .select("id, name, status, created_at")
        .or("status.eq.pending,name.ilike.%Test%,name.ilike.%EMERGENCY%")
        .order("created_at", { ascending: false })

      setStartups(refreshedData || [])

    } catch (err) {
      console.error("Error creating test startup:", err)
      toast({
        title: "Error",
        description: "Failed to create test startup",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Fix status to pending
  async function fixStatus(id: string) {
    try {
      const { error } = await supabase
        .from("startups")
        .update({ 
          status: "pending",
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error

      // Update local state
      setStartups(startups.map(s => 
        s.id === id ? { ...s, status: "pending" } : s
      ))

      toast({
        title: "Success",
        description: "Status updated to pending",
      })
    } catch (err) {
      console.error("Error fixing status:", err)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Test Startups</h1>
          <p className="text-muted-foreground">
            Create and manage test startups for moderation testing
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/moderation">
              Back to Moderation
            </Link>
          </Button>
          
          <Button 
            onClick={createTestStartup}
            disabled={creating}
          >
            {creating ? (
              <>
                <LoadingIndicator size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Test Startup'
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Startups ({startups.length})</CardTitle>
          <CardDescription>
            Startups created for testing the moderation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingIndicator size="lg" />
            </div>
          ) : startups.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No test startups found</p>
              <Button onClick={createTestStartup} className="mt-4">
                Create Test Startup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {startups.map(startup => (
                <Card key={startup.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{startup.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={
                            startup.status === "pending" ? "default" :
                            startup.status === "approved" ? "outline" :
                            startup.status === "rejected" ? "destructive" : 
                            "outline"
                          }>
                            {startup.status || "No status"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Created: {new Date(startup.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        {startup.status !== "pending" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fixStatus(startup.id)}
                          >
                            Fix Status
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/20 flex justify-between">
          <p className="text-sm text-muted-foreground">
            All test startups are shown here, regardless of status
          </p>
          <Link href="/admin/moderation/raw" className="text-sm text-primary">
            View all startups →
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 