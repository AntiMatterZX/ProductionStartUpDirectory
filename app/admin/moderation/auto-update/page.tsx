"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import LoadingIndicator from "@/components/ui/loading-indicator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client-component"

export default function AutoUpdatePage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function runManualUpdate() {
    try {
      setIsUpdating(true)
      setResults(null)

      // Find startups with missing or incorrect status
      const { data: startups, error: searchError } = await supabase
        .from('startups')
        .select('id, name, status, created_at')
        .not('status', 'in', '("pending","approved","rejected")')
        .order('created_at', { ascending: false })

      if (searchError) throw searchError

      if (!startups || startups.length === 0) {
        setResults({ 
          success: true, 
          message: 'No startups need updates',
          updatedCount: 0,
          updatedStartups: []
        })
        toast({
          title: "Status check complete",
          description: "All startups already have correct moderation status.",
        })
        return
      }

      // Update all found startups to pending status
      const startupIds = startups.map(s => s.id)
      const { error: updateError } = await supabase
        .from('startups')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString() 
        })
        .in('id', startupIds)

      if (updateError) throw updateError

      // Save and display results
      const updatedStartups = startups.map(s => ({ 
        id: s.id, 
        name: s.name, 
        oldStatus: s.status,
        created_at: s.created_at
      }))

      setResults({
        success: true,
        updatedCount: startups.length,
        updatedStartups
      })

      toast({
        title: "Update successful",
        description: `${startups.length} startup(s) updated to pending status.`,
      })

      // Refresh the page list
      router.refresh()
      
    } catch (error) {
      console.error('Error updating startup statuses:', error)
      toast({
        title: "Update failed",
        description: "There was an error updating startup statuses.",
        variant: "destructive",
      })
      setResults({ error: (error as Error).message })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Startup Status Auto-Update</h1>
          <p className="text-muted-foreground">
            Ensure all startups have the correct moderation status
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/moderation">
              Back to Moderation
            </Link>
          </Button>
          <Button 
            onClick={runManualUpdate} 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <LoadingIndicator size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              'Run Manual Update'
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Update System</CardTitle>
          <CardDescription>
            This tool finds startups with missing or incorrect status values and updates them to "pending" so they appear in the moderation queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-md">
            <h3 className="font-medium mb-2">How it works:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Scans all startups in the database</li>
              <li>Identifies startups with status values other than "pending", "approved", or "rejected"</li>
              <li>Updates all identified startups to "pending" status</li>
              <li>These startups will then appear in the moderation queue for review</li>
            </ul>
          </div>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Update Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results.error ? (
                  <div className="text-red-500">Error: {results.error}</div>
                ) : results.message ? (
                  <div>{results.message}</div>
                ) : (
                  <div>
                    <p className="mb-4">Updated {results.updatedCount} startup(s) to pending status:</p>
                    <div className="overflow-auto max-h-96">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Name</th>
                            <th className="text-left py-2">Previous Status</th>
                            <th className="text-left py-2">Created Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.updatedStartups.map((startup: any) => (
                            <tr key={startup.id} className="border-b">
                              <td className="py-2">{startup.name}</td>
                              <td className="py-2">{startup.oldStatus || 'None'}</td>
                              <td className="py-2">{new Date(startup.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 