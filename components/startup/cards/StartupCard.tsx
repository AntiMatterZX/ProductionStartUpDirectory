import Link from "next/link"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, Users2Icon, ExternalLink, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StartupCardProps {
  startup: any // Using any for simplicity, but should use the Startup type
  showStatusControls?: boolean // Added to control visibility of status controls
  onUpdateStatus?: (id: string, status: 'pending' | 'approved' | 'rejected') => Promise<void>
  isUpdating?: boolean
}

export default function StartupCard({ 
  startup, 
  showStatusControls = false,
  onUpdateStatus,
  isUpdating = false
}: StartupCardProps) {
  // Map status to appropriate badge variant and custom colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { 
          variant: "outline" as const, 
          className: "border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300",
          icon: <CheckCircle className="h-3 w-3 mr-1" />
        }
      case "rejected":
        return { 
          variant: "outline" as const, 
          className: "border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
          icon: <XCircle className="h-3 w-3 mr-1" />
        }
      default:
        return { 
          variant: "outline" as const, 
          className: "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
          icon: <AlertCircle className="h-3 w-3 mr-1" /> 
        }
    }
  }

  const badgeInfo = getStatusBadge(startup.status)
  
  // Style the card border based on status
  const getCardBorderClass = (status: string) => {
    switch (status) {
      case "approved":
        return "border-green-200 dark:border-green-900"
      case "rejected":
        return "border-red-200 dark:border-red-900"
      default:
        return "border-amber-200 dark:border-amber-900"
    }
  }

  return (
    <div
      className={cn(
        "relative h-full rounded-xl border-2 bg-card text-card-foreground shadow-sm overflow-hidden",
        getCardBorderClass(startup.status)
      )}
    >
      <CardHeader
        className={`pb-2 p-4 ${
          startup.status === "approved" 
            ? "bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20" 
            : startup.status === "rejected"
              ? "bg-gradient-to-r from-red-50 to-neutral-50 dark:from-red-900/20 dark:to-neutral-900/20"
              : "bg-gradient-to-r from-amber-50 to-neutral-50 dark:from-amber-900/20 dark:to-neutral-900/20"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {startup.logo_url ? (
                <img
                  src={startup.logo_url || "/placeholder.svg"}
                  alt={startup.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-primary font-bold">{startup.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{startup.name}</h3>
              <p className="text-sm text-muted-foreground">{startup.categories?.name || "Uncategorized"}</p>
            </div>
          </div>
          <Badge variant={badgeInfo.variant} className={badgeInfo.className}>
            <span className="flex items-center">
              {badgeInfo.icon}
              {startup.status.charAt(0).toUpperCase() + startup.status.slice(1)}
            </span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <p className="line-clamp-3 text-sm text-muted-foreground mb-4">
          {startup.description || "No description provided"}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {startup.founding_date && (
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>Founded {new Date(startup.founding_date).getFullYear()}</span>
            </div>
          )}
          {startup.location && (
            <div className="flex items-center">
              <MapPinIcon className="h-3 w-3 mr-1" />
              <span>{startup.location}</span>
            </div>
          )}
          {startup.employee_count && (
            <div className="flex items-center">
              <Users2Icon className="h-3 w-3 mr-1" />
              <span>{startup.employee_count} employees</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center border-t pt-4 p-4">
        <span className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(startup.created_at), { addSuffix: true })}
        </span>
        <div className="flex gap-2">
          <Link href={`/dashboard/startups/${startup.id}`}>
            <Button size="sm" variant="outline">
              Manage
            </Button>
          </Link>
          {startup.status === "approved" && (
            <Link href={`/startups/${startup.slug}`} target="_blank">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            </Link>
          )}
        </div>
      </CardFooter>
      
      {/* Status change controls - only shown if requested */}
      {showStatusControls && onUpdateStatus && (
        <div className="px-4 pb-4 mt-[-8px]">
          <div className="flex justify-center gap-2 border-t pt-3">
            {/* Only show status buttons for statuses that aren't current */}
            {startup.status !== "pending" && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onUpdateStatus(startup.id, "pending")}
                disabled={isUpdating}
                className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Mark Pending
              </Button>
            )}
            
            {startup.status !== "approved" && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onUpdateStatus(startup.id, "approved")}
                disabled={isUpdating}
                className="bg-green-50 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
            
            {startup.status !== "rejected" && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onUpdateStatus(startup.id, "rejected")}
                disabled={isUpdating}
                className="bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}
