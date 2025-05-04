"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { CheckCircle2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLoading } from "@/components/ui/loading-context"
import LoadingIndicator from "@/components/ui/loading-indicator"

interface ApprovalButtonsProps {
  startupId: string
}

export function ApprovalButtons({ startupId }: ApprovalButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { startLoading, stopLoading } = useLoading()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  async function handleApproval(approve: boolean) {
    try {
      setIsLoading(true)
      startLoading(`${approve ? 'Approving' : 'Rejecting'} startup...`)
      
      const { error } = await supabase
        .from("startups")
        .update({ 
          status: approve ? "approved" : "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", startupId)
      
      if (error) {
        throw error
      }
      
      toast({
        title: approve ? "Startup approved" : "Startup rejected",
        description: approve 
          ? "The startup has been approved and is now public." 
          : "The startup has been rejected.",
        variant: approve ? "default" : "destructive",
      })
      
      router.refresh()
    } catch (error) {
      toast({
        title: "Action failed",
        description: "There was an error processing your request.",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsLoading(false)
      stopLoading()
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="border-red-200 hover:bg-red-100 hover:text-red-900 dark:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        onClick={() => handleApproval(false)}
        disabled={isLoading}
      >
        {isLoading ? <LoadingIndicator size="sm" className="mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
        Reject
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="border-green-200 hover:bg-green-100 hover:text-green-900 dark:border-green-800 dark:hover:bg-green-900/20 dark:hover:text-green-400"
        onClick={() => handleApproval(true)}
        disabled={isLoading}
      >
        {isLoading ? <LoadingIndicator size="sm" className="mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
        Approve
      </Button>
    </div>
  )
} 