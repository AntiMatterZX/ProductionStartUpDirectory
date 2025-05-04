"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronLeft, 
  Compass, 
  FilePlus, 
  Home, 
  LayoutDashboard, 
  Zap, 
  Package, 
  Settings, 
  Star,
  Rocket,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "./sidebar-context"
import { ModeToggle } from "@/components/theme/mode-toggle"

export function DashboardSidebar() {
  const { sidebarOpen, toggleSidebar } = useSidebar()
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname() ?? ""
  const supabase = createClientComponentClient()
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*, roles(name)")
          .eq("id", user.id)
          .single()
        if (data) setProfile(data)
      }
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    fetchProfile()
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [supabase])

  const userRole = profile?.roles?.name || "user"
  const isActive = (href: string) => {
    // Exact match for the path
    if (pathname === href) return true;
    
    // Special case for /dashboard/startups/create
    if (href === "/dashboard/startups/create") {
      return pathname === "/dashboard/startups/create" || pathname.startsWith("/dashboard/startups/create/");
    }
    
    // Special case for /dashboard/startups
    if (href === "/dashboard/startups") {
      return pathname.startsWith("/dashboard/startups") && 
             !pathname.startsWith("/dashboard/startups/create");
    }
    
    // Default case for other paths
    return href !== "/dashboard" && pathname.startsWith(href);
  }

  const variants = {
    visible: { 
      x: 0,
      opacity: 1
    },
    hidden: { 
      x: "-100%",
      opacity: 0
    }
  }

  // If mobile and not open, don't render to save resources
  if (isMobile && !sidebarOpen) {
    return null
  }

  return (
    <>
      {/* Mobile overlay - only show when sidebar is open on mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}

      <motion.aside
        initial={isMobile ? "hidden" : "visible"}
        animate={sidebarOpen ? "visible" : "hidden"}
        variants={variants}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-screen z-50 bg-background border-r shadow-md",
          "flex flex-col overflow-hidden w-[240px]",
          isMobile ? "lg:relative" : "lg:relative"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b relative">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-2 bg-primary rounded-lg text-primary-foreground">
              <Rocket className="h-5 w-5" />
            </div>
            <span className="font-semibold truncate">LaunchPad</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive("/dashboard")} />
            <NavItem href="/dashboard/startups" icon={Package} label="My Startups" active={isActive("/dashboard/startups")} />
            <NavItem href="/dashboard/startups/create" icon={FilePlus} label="Create Startup" active={isActive("/dashboard/startups/create")} />
            <NavItem href="/dashboard/discover" icon={Compass} label="Discover" active={isActive("/dashboard/discover")} />

            {(userRole === "investor" || userRole === "admin") && (
              <>
                <SectionLabel label="Investor" />
                <NavItem href="/dashboard/investor/wishlist" icon={Star} label="Wishlist" active={isActive("/dashboard/investor/wishlist")} />
                <NavItem href="/dashboard/investor/opportunities" icon={Zap} label="Opportunities" active={isActive("/dashboard/investor/opportunities")} />
              </>
            )}

            {userRole === "admin" && (
              <>
                <SectionLabel label="Admin" />
                <NavItem href="/admin" icon={Home} label="Admin Panel" active={isActive("/admin")} />
              </>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t">
          {/* User profile */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{profile?.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{userRole}</p>
                </div>
              </div>
              <Link 
                href="/dashboard/settings" 
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          {/* Copyright and mode toggle */}
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} LaunchPad
            </p>
            <ModeToggle />
          </div>
        </div>
      </motion.aside>
    </>
  )
}

function NavItem({ href, icon: Icon, label, active }: { 
  href: string
  icon: any
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active 
          ? "bg-accent text-accent-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 text-xs font-medium text-muted-foreground">
      {label}
    </div>
  )
}