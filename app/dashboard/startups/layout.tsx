import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

interface StartupsLayoutProps {
  children: React.ReactNode
}

export default function StartupsLayout({ children }: StartupsLayoutProps) {
  return (
    <>
      {/* This will provide a consistent layout for all startup pages */}
      <Suspense fallback={
        <div className="container py-10 flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        {children}
      </Suspense>
      <Toaster />
    </>
  )
} 