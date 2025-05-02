"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MotionDiv, MotionH1, MotionP } from "@/components/ui/motion"

export default function StartupNotFound() {
  return (
    <div className="container py-20 text-center">
      <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <MotionH1
          className="text-4xl font-bold mb-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Startup Not Found
        </MotionH1>
        <MotionP
          className="text-muted-foreground mb-8 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          The startup you're looking for doesn't exist or may have been removed.
        </MotionP>
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex justify-center gap-4"
        >
          <Button asChild className="rounded-full">
            <Link href="/startups">Browse Startups</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/dashboard/startups/create">Create a Startup</Link>
          </Button>
        </MotionDiv>
      </MotionDiv>
    </div>
  )
}
