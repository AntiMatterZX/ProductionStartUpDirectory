import Link from "next/link"
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, Users2Icon, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { MotionDiv } from "@/components/ui/motion"

interface StartupCardProps {
  startup: any // Using any for simplicity, but should use the Startup type
}

export default function StartupCard({ startup }: StartupCardProps) {
  // Map status to appropriate badge variant and custom colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { variant: "outline" as const, className: "border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300" }
      case "rejected":
        return { variant: "outline" as const, className: "border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300" }
      default:
        return { variant: "outline" as const, className: "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300" }
    }
  }

  const badgeInfo = getStatusBadge(startup.status)

  return (
    <MotionDiv
      className="h-full rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden card-hover"
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <CardHeader
        className={`pb-2 p-4 ${startup.status === "approved" ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20" : ""}`}
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
            {startup.status.charAt(0).toUpperCase() + startup.status.slice(1)}
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
    </MotionDiv>
  )
}
