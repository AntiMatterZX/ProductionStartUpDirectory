import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface SlugCheckerProps {
  slug: string
  isAvailable: boolean
  isChecking?: boolean
}

export default function SlugChecker({ slug, isAvailable, isChecking = false }: SlugCheckerProps) {
  if (!slug) return null

  if (isChecking) {
    return (
      <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span className="text-xs">Checking...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {isAvailable ? (
        <div className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-md">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span className="text-xs font-medium">Available</span>
        </div>
      ) : (
        <div className="flex items-center text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md">
          <XCircle className="h-4 w-4 mr-2" />
          <span className="text-xs font-medium">Unavailable</span>
        </div>
      )}
    </div>
  )
}
