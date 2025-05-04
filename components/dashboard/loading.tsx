"use client"

import { PsychedelicLoader } from "@/components/ui/psychedelic-loader"

export function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <PsychedelicLoader />
    </div>
  )
} 