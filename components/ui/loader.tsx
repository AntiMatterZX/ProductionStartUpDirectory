"use client"

import { cn } from "@/lib/utils"
import PsychedelicLoader from "./psychedelic-loader"

type LoaderVariant = "spinner" | "psychedelic" | "skeleton" 
type LoaderSize = "sm" | "md" | "lg" | "xl"

interface LoaderProps {
  variant?: LoaderVariant
  size?: LoaderSize
  fullscreen?: boolean
  className?: string
  center?: boolean
  text?: string
}

export default function Loader({
  variant = "psychedelic",
  size = "md",
  fullscreen = false,
  className,
  center = true,
  text
}: LoaderProps) {
  // Size classes for spinner
  const spinnerSizes = {
    sm: "h-6 w-6 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
    xl: "h-16 w-16 border-4"
  }

  // Container sizes for psychedelic loader
  const containerSizes = {
    sm: "h-16 w-16",
    md: "h-32 w-32",
    lg: "h-48 w-48",
    xl: "h-64 w-64"
  }

  // Generate container classes
  const containerClasses = cn(
    center && "flex flex-col items-center justify-center",
    fullscreen && "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
    !fullscreen && center && "h-full w-full",
    className
  )

  if (variant === "spinner") {
    return (
      <div className={containerClasses}>
        <div className={cn(
          "rounded-full border-primary border-t-transparent animate-spin",
          spinnerSizes[size]
        )} />
        {text && <p className="mt-4 text-center text-muted-foreground">{text}</p>}
      </div>
    )
  }

  if (variant === "psychedelic") {
    return (
      <div className={containerClasses}>
        <div className={cn(containerSizes[size])}>
          <PsychedelicLoader />
        </div>
        {text && <p className="mt-4 text-center text-muted-foreground">{text}</p>}
      </div>
    )
  }

  if (variant === "skeleton") {
    return (
      <div className={containerClasses}>
        <div className="w-full space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded-md w-3/4" />
          <div className="h-4 bg-muted rounded-md w-1/2" />
          <div className="h-12 bg-muted rounded-md" />
          <div className="h-4 bg-muted rounded-md w-2/3" />
        </div>
        {text && <p className="mt-4 text-center text-muted-foreground">{text}</p>}
      </div>
    )
  }

  // Default fallback
  return (
    <div className={containerClasses}>
      <div className={cn(
        "rounded-full border-primary border-t-transparent animate-spin",
        spinnerSizes.md
      )} />
      {text && <p className="mt-4 text-center text-muted-foreground">{text}</p>}
    </div>
  )
} 