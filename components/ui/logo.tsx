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
        className={`relative ${sizeClasses[size]} rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden`}
        whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
      >
        {/* Rocket SVG Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 text-white"
        >
          <path 
            d="M4.5 16.5C3 17.76 3 20.67 3 20.67C3 20.67 5.9 20.67 7.16 19.21M20.7 7.17C20.7 7.17 15.77 2.3 8.16 8.42C4.07 11.91 3.11 16.17 3.04 18.58C5.45 18.51 9.71 17.55 13.2 13.46C19.32 5.85 14.45 0.92 14.45 0.92M14.24 8.94L15.05 9.74M16.24 7.11L18.75 9.62" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
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
          className={`font-bold ${textSizeClasses[size]} tracking-wider`}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Launch</span>
          <span className="text-primary">Pad</span>
        </MotionDiv>
      )}
    </Link>
  )
}
