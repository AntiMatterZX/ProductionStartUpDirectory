"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import LoadingIndicator from "@/components/ui/loading-indicator"

export default function RawStartupView() {
  const [startups, setStartups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchAllStartups() {
      try {
        setLoading(true)
        
        // Fetch ALL startups with minimal filtering to see what's actually in the database
        const { data, error } = await supabase
          .from("startups")
          .select("id, name, status, created_at, updated_at")
          .order("created_at", { ascending: false })
        
        if (error) {
          throw error
        }
        
        setStartups(data || [])
      } catch (err: any) {
        console.error("Error fetching startups:", err)
        setError(err.message || "Failed to load startups")
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllStartups()
  }, [supabase])

  // Manual update function to fix status
  async function updateStartupStatus(id: string, status: string) {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from("startups")
        .update({ 
          status: status,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
      
      if (error) {
        throw error
      }
      
      // Refresh the list
      const { data } = await supabase
        .from("startups")
        .select("id, name, status, created_at, updated_at")
        .order("created_at", { ascending: false })
      
      setStartups(data || [])
      
    } catch (err: any) {
      console.error("Error updating startup:", err)
      setError(err.message || "Failed to update startup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Raw Startup Data</h1>
          <p className="text-muted-foreground">
            Debug view of all startups in the database
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
            Complete list of startups with status values - use this to debug moderation issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingIndicator size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">
              Error: {error}
            </div>
          ) : startups.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No startups found in the database
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border px-4 py-2 text-left">ID</th>
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Status</th>
                    <th className="border px-4 py-2 text-left">Created</th>
                    <th className="border px-4 py-2 text-left">Updated</th>
                    <th className="border px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {startups.map((startup) => (
                    <tr key={startup.id} className="hover:bg-muted/20">
                      <td className="border px-4 py-2 text-xs">{startup.id}</td>
                      <td className="border px-4 py-2 font-medium">{startup.name}</td>
                      <td className="border px-4 py-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          startup.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : startup.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : startup.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                          {startup.status || 'none'}
                        </span>
                      </td>
                      <td className="border px-4 py-2 text-sm">
                        {new Date(startup.created_at).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2 text-sm">
                        {new Date(startup.updated_at).toLocaleString()}
                      </td>
                      <td className="border px-4 py-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateStartupStatus(startup.id, 'pending')}
                          >
                            Set Pending
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 