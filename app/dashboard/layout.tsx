"use client"

import React, { useState, useEffect } from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { AdminSidebar } from "@/components/dashboard/AdminSidebar" 
import { ModeToggle } from "@/components/theme/mode-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    // Mark as hydrated for client-side rendering
    setIsHydrated(true)
    
    // Get authenticated user
    async function fetchUser() {
      try {
        const { user: authUser } = await getAuthUser()
        if (!authUser) {
          window.location.href = "/login"
        } else {
          // Store only the serializable properties we need
          setUser({
            id: authUser.id,
            email: authUser.email
          })
        }
      } catch (error) {
        console.error("Auth error:", error)
        window.location.href = "/login"
      }
    }
    
    fetchUser()
    
    // Handle resize events
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }
    
    // Set initial state based on screen size
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  // Show loading state while client-side hydration is happening
  if (!isHydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar with open state passed from parent */}
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content - ensure it takes full width when sidebar is closed */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : 'w-full'}`}>
        <DashboardHeader 
          user={user} 
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        
        <footer className="border-t py-3 text-xs text-center text-muted-foreground">
          <div className="flex items-center justify-between px-4 md:px-6">
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
  )
}
