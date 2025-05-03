"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type SidebarContextType = {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // Initialize sidebar state based on screen size
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024)
    }
    
    // Set initial state
    handleResize()
    
    // Update on resize
    window.addEventListener("resize", handleResize)
    
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
} 