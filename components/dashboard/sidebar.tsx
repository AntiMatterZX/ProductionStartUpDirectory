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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar"

interface DashboardSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function DashboardSidebar({ isOpen, setIsOpen }: DashboardSidebarProps) {
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname() || ""
  
  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      const supabase = createClientComponentClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*, roles(name)")
          .eq("id", user.id)
          .single()
          
        if (data) {
          setProfile(data)
        }
      }
    }
    
    fetchProfile()
  }, [])
  
  // Close sidebar when clicking on a link on mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false)
    }
  }
  
  const userRole = profile?.roles?.name || "user"

  // Define navigation items based on user role
  const mainNavItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/startups",
      icon: Package,
      label: "My Startups",
      isActive: pathname.startsWith("/dashboard/startups") && pathname !== "/dashboard/startups/create",
    },
    {
      href: "/dashboard/startups/create",
      icon: FilePlus,
      label: "Create Startup",
      isActive: pathname === "/dashboard/startups/create",
    },
    {
      href: "/dashboard/discover",
      icon: Compass,
      label: "Discover",
      isActive: pathname === "/dashboard/discover",
    },
  ]

  const investorNavItems = (userRole === "investor" || userRole === "admin") ? [
    {
      href: "/dashboard/investor/wishlist",
      icon: Star,
      label: "Wishlist",
      isActive: pathname === "/dashboard/investor/wishlist",
    },
    {
      href: "/dashboard/investor/opportunities",
      icon: Zap,
      label: "Opportunities",
      isActive: pathname === "/dashboard/investor/opportunities",
    },
  ] : []

  const adminNavItems = userRole === "admin" ? [
    {
      href: "/admin",
      icon: Home,
      label: "Admin Panel",
      isActive: pathname.startsWith("/admin"),
    },
  ] : []

  return (
    <>
      {/* Mobile backdrop overlay when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <AnimatePresence initial={false}>
        {(isOpen || window.innerWidth >= 1024) && (
          <motion.div
            key="sidebar"
            initial={{ width: 240, x: -240 }}
            animate={{ width: 240, x: 0 }}
            exit={{ width: 240, x: -240 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "fixed left-0 top-0 h-screen z-40",
              "lg:relative lg:z-0"
            )}
          >
            <Sidebar variant="floating" className="h-full border-r shadow-sm">
              <SidebarHeader className="h-16 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Rocket className="h-4 w-4" />
                    </div>
                    <span className="font-semibold">LaunchPad</span>
                  </div>
                  
                  <div className="flex gap-1">
                    {/* Mobile close button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {/* Desktop toggle button - hidden now */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(!isOpen)}
                      className="h-8 w-8 hidden"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SidebarHeader>
              
              <SidebarSeparator />
              
              <SidebarContent>
                {/* Main navigation group */}
                <SidebarGroup>
                  <SidebarGroupLabel>Main</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {mainNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={item.isActive} className="gap-2">
                            <Link href={item.href} onClick={handleLinkClick}>
                              <div className="flex h-4 w-4 items-center justify-center">
                                <item.icon className="h-4 w-4" />
                              </div>
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                
                {/* Investor navigation group - conditional */}
                {investorNavItems.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Investor</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {investorNavItems.map((item) => (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={item.isActive} className="gap-2">
                              <Link href={item.href} onClick={handleLinkClick}>
                                <div className="flex h-4 w-4 items-center justify-center">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
                
                {/* Admin navigation group - conditional */}
                {adminNavItems.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Admin</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {adminNavItems.map((item) => (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={item.isActive} className="gap-2">
                              <Link href={item.href} onClick={handleLinkClick}>
                                <div className="flex h-4 w-4 items-center justify-center">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </SidebarContent>
              
              <SidebarFooter className="mt-auto border-t p-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/dashboard/settings"} className="gap-2">
                      <Link href="/dashboard/settings" onClick={handleLinkClick}>
                        <div className="flex h-4 w-4 items-center justify-center">
                          <Settings className="h-4 w-4" />
                        </div>
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              
              <SidebarRail />
            </Sidebar>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 