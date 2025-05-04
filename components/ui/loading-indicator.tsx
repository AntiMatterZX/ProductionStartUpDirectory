"use client"

import { cn } from "@/lib/utils"
import PsychedelicLoader from "./psychedelic-loader"

interface LoadingIndicatorProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export default function LoadingIndicator({ className, size = "md" }: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={sizeClasses[size]}>
        <PsychedelicLoader />
      </div>
    </div>
  )
} 