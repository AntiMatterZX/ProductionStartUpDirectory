import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

interface StartupsLayoutProps {
  children: React.ReactNode
}

export default function StartupsLayout({ children }: StartupsLayoutProps) {
  return (
    <div className="h-full w-full">
      {/* This will provide a consistent layout for all startup pages */}
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        {children}
      </Suspense>
      <Toaster />
    </div>
  )
} 