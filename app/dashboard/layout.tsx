import React from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider } from "@/components/dashboard/sidebar-context"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get authenticated user or redirect to login
  const { user } = await getAuthUser("/dashboard")
  
  if (!user) {
    return redirect("/login")
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          
          <div className="flex flex-col flex-1 w-full">
            <DashboardHeader user={user} />
            
            <main className="flex-1 overflow-y-auto pb-16 p-4 md:p-6 w-full">
              <div className="mx-auto max-w-7xl w-full">
                {children}
              </div>
            </main>
            
            <footer className="bg-background border-t border-border w-full py-3 px-4 md:px-6">
              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <p className="text-center text-xs text-muted-foreground">
                  &copy; {new Date().getFullYear()} LaunchPad. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                  <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </a>
                  <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </a>
                  <a href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
