"use client"

import { useState, useEffect } from "react"
import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  FilePlus, 
  Compass, 
  Star, 
  Zap, 
  Home, 
  Settings,
  Rocket
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

interface DashboardSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function AdminSidebar({ isOpen, setIsOpen }: DashboardSidebarProps) {
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

  // Define navigation items for each user role section
  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      title: "My Startups",
      href: "/dashboard/startups",
      icon: Package,
      isActive: pathname.startsWith("/dashboard/startups") && pathname !== "/dashboard/startups/create",
    },
    {
      title: "Create Startup",
      href: "/dashboard/startups/create",
      icon: FilePlus,
      isActive: pathname === "/dashboard/startups/create",
    },
    {
      title: "Discover",
      href: "/dashboard/discover",
      icon: Compass,
      isActive: pathname === "/dashboard/discover",
    },
  ]

  const investorNavItems = (userRole === "investor" || userRole === "admin") ? [
    {
      title: "Wishlist",
      href: "/dashboard/investor/wishlist",
      icon: Star,
      isActive: pathname === "/dashboard/investor/wishlist",
    },
    {
      title: "Opportunities",
      href: "/dashboard/investor/opportunities",
      icon: Zap,
      isActive: pathname === "/dashboard/investor/opportunities",
    },
  ] : []

  const adminNavItems = userRole === "admin" ? [
    {
      title: "Admin Panel",
      href: "/admin",
      icon: Home,
      isActive: pathname.startsWith("/admin"),
    },
  ] : []

  // Combine all sections into a grouped object
  const groupedNavItems: Record<string, Array<any>> = {
    "Main": mainNavItems,
    ...(investorNavItems.length > 0 ? { "Investor": investorNavItems } : {}),
    ...(adminNavItems.length > 0 ? { "Admin": adminNavItems } : {})
  }

  // Get user initials for avatar
  const initials = profile?.full_name 
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() 
    : profile?.email?.substring(0, 2).toUpperCase() || "UN"

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
      
      <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={setIsOpen}>
        <Sidebar variant="floating" className="border-0 h-screen fixed left-0 top-0 z-40 lg:relative lg:z-0">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Rocket className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold">LaunchPad</span>
                <span className="text-xs text-muted-foreground">Startup Platform</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            {Object.entries(groupedNavItems).map(([section, items]) => (
              items.length > 0 && (
                <SidebarGroup key={section}>
                  <SidebarGroupLabel>{section}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title} className="gap-3">
                            <Link href={item.href} onClick={handleLinkClick}>
                              <div className="flex h-5 w-5 items-center justify-center">
                                <item.icon className="h-[18px] w-[18px]" />
                              </div>
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                          {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )
            ))}
          </SidebarContent>

          <SidebarFooter className="mt-auto p-4">
            <div className="flex items-center justify-between rounded-xl bg-muted p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{profile?.full_name || "User"}</span>
                  <span className="text-xs text-muted-foreground">{userRole}</span>
                </div>
              </div>
              <Link href="/dashboard/settings" onClick={handleLinkClick}>
                <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>
      </SidebarProvider>
    </>
  )
} 