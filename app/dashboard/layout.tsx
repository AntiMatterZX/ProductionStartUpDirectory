import React from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { AdminSidebar } from "@/components/dashboard/admin-sidebar"
import { ModeToggle } from "@/components/theme/mode-toggle"

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
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader user={user} />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
