import React from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main content container */}
        <div className="flex flex-col flex-1 w-full md:pl-0">
          {/* Header */}
          <DashboardHeader user={user} />
          
          {/* Main content with proper padding */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
          
          {/* Footer */}
          <footer className="border-t py-3 text-xs text-center text-muted-foreground">
            <div className="flex items-center justify-between px-4 md:px-6">
              <div className="text-xs text-muted-foreground">
                <p className="hidden md:block">© {new Date().getFullYear()} LaunchPad. All rights reserved.</p>
                <p className="md:hidden">© {new Date().getFullYear()} LaunchPad</p>
              </div>
              <div className="md:hidden">
                <ModeToggle />
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
