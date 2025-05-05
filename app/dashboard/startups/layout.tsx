import type React from "react"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

interface StartupsLayoutProps {
  children: React.ReactNode
}

export default function StartupsLayout({ children }: StartupsLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <Toaster />
    </div>
  )
}
