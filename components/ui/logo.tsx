"use client"

import { MotionDiv } from "@/components/ui/motion"
import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  withText?: boolean
  className?: string
}

export function Logo({ size = "md", withText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <MotionDiv
        className={`relative ${sizeClasses[size]} rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center`}
        whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
      >
        <span className="font-bold text-white">V</span>
        <MotionDiv
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-400"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        />
      </MotionDiv>
      {withText && (
        <MotionDiv
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`font-bold ${textSizeClasses[size]}`}
        >
          <span>Venture</span>
          <span className="text-primary">Connect</span>
        </MotionDiv>
      )}
    </Link>
  )
}
