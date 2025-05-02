import React from "react"
import { getAuthUserWithRole } from "@/lib/auth/auth"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get authenticated user with role check
  await getAuthUserWithRole("/admin/dashboard", "admin")

  return (
    <div className="flex min-h-screen bg-indigo-50">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
} 