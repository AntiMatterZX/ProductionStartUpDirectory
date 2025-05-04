"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion" 
import { ThumbsUp, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UpvoteButtonProps {
  count: number
  onUpvote: () => void
  isActive: boolean
  isLoading?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function UpvoteButton({ 
  count, 
  onUpvote, 
  isActive, 
  isLoading = false,
  className,
  size = "md"
}: UpvoteButtonProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  
  // Sizes mapping
  const sizes = {
    sm: {
      button: "px-3 py-1 text-xs gap-1.5",
      icon: "h-3 w-3",
      stars: "h-2 w-2",
      starsCount: 3
    },
    md: {
      button: "px-4 py-2 gap-2",
      icon: "h-4 w-4",
      stars: "h-3 w-3",
      starsCount: 5
    },
    lg: {
      button: "px-5 py-2.5 text-lg gap-2.5",
      icon: "h-5 w-5", 
      stars: "h-4 w-4",
      starsCount: 7
    }
  }
  
  const currentSize = sizes[size]
  
  const handleClick = () => {
    onUpvote()
    if (!isActive) {
      setShowAnimation(true)
      setTimeout(() => setShowAnimation(false), 1500)
    }
  }
  
  return (
    <div className={cn("relative", className)}>
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "flex items-center rounded-full transition-all duration-300",
          isActive && "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
          currentSize.button
        )}
      >
        <ThumbsUp className={cn(
          currentSize.icon,
          isActive ? "text-primary-foreground" : ""
        )} />
        <span className="font-medium">{count}</span>
      </Button>
      
      {/* Rising stars animation */}
      <AnimatePresence>
        {showAnimation && (
          <div className="absolute -top-2 left-0 right-0 pointer-events-none overflow-hidden h-20">
            {[...Array(currentSize.starsCount)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: 0, 
                  x: 10 + i * 5, 
                  opacity: 0, 
                  scale: 0,
                  rotate: 0
                }}
                animate={{ 
                  y: -20 - Math.random() * 30, 
                  x: 10 + Math.random() * 20, 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 180 - 90
                }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeOut",
                  times: [0, 0.3, 1],
                  delay: i * 0.1
                }}
                className="absolute"
              >
                <Star 
                  className={cn(
                    "text-yellow-400 fill-yellow-400",
                    currentSize.stars
                  )} 
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
} 