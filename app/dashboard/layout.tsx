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
      <div className="flex h-screen bg-background overflow-hidden">
        <DashboardSidebar />
        
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <DashboardHeader user={user} />
          
          <main className="flex-1 p-4 md:p-6 w-full overflow-hidden">
            <div className="mx-auto max-w-7xl w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
