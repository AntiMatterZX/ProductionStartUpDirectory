"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

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
      <motion.div
        className={cn(
          "rounded-full border-2 border-primary/30 border-t-primary/90",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear"
        }}
      />
    </div>
  )
} 