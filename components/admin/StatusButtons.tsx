import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import LoadingIndicator from "@/components/ui/loading-indicator";

interface StatusButtonsProps {
  startupId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function StatusButtons({ 
  startupId, 
  currentStatus,
  onStatusChange
}: StatusButtonsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  const updateStatus = async (newStatus: 'pending' | 'approved' | 'rejected') => {
    // Set the appropriate loading state
    if (newStatus === 'approved') setIsApproving(true);
    else if (newStatus === 'rejected') setIsRejecting(true);
    else setIsPending(true);
    
    try {
      // Try the admin endpoint first (which will work for admins)
      let response = await fetch('/api/admin/startups/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          startupId, 
          status: newStatus 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }
      
      toast({
        title: "Status Updated",
        description: `Startup is now ${newStatus}`,
      });
      
      // Call the callback to update parent component state
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error(`Error updating status to ${newStatus}:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update startup status",
        variant: "destructive",
      });
    } finally {
      // Reset all loading states
      setIsApproving(false);
      setIsRejecting(false);
      setIsPending(false);
    }
  };
  
  return (
    <div className="flex gap-2">
      {/* Only show buttons for statuses that aren't current */}
      {currentStatus !== "pending" && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => updateStatus("pending")}
          disabled={isApproving || isRejecting || isPending}
          className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
        >
          {isPending ? (
            <LoadingIndicator size="sm" />
          ) : (
            <>
              <AlertCircle className="h-3 w-3 mr-1" />
              Pending
            </>
          )}
        </Button>
      )}
      
      {currentStatus !== "approved" && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => updateStatus("approved")}
          disabled={isApproving || isRejecting || isPending}
          className="bg-green-50 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
        >
          {isApproving ? (
            <LoadingIndicator size="sm" />
          ) : (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </>
          )}
        </Button>
      )}
      
      {currentStatus !== "rejected" && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => updateStatus("rejected")}
          disabled={isApproving || isRejecting || isPending}
          className="bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
        >
          {isRejecting ? (
            <LoadingIndicator size="sm" />
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </>
          )}
        </Button>
      )}
    </div>
  );
} 