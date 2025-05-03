import React from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider } from "@/components/dashboard/sidebar-context"

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
      <div className="flex h-screen bg-background overflow-hidden">
        <DashboardSidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardHeader user={user} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
          
          <footer className="border-t py-3 text-xs text-center text-muted-foreground">
            <div className="flex items-center justify-between px-6">
              <div className="text-xs text-muted-foreground mt-auto">
                <div className="hidden md:block">
                  <p>© {new Date().getFullYear()} LaunchPad. All rights reserved.</p>
                </div>
              </div>
              <ModeToggle />
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
