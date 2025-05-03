"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  FilePlus,
  Compass,
  Star,
  Zap,
  Rocket,
  Settings,
  ChevronLeft,
  Menu
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  section?: string
  requiredRoles?: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "Main",
  },
  {
    title: "My Startups",
    href: "/dashboard/startups",
    icon: Package,
    section: "Startups",
  },
  {
    title: "Create Startup",
    href: "/dashboard/startups/create",
    icon: FilePlus,
    section: "Startups",
  },
  {
    title: "Discover",
    href: "/dashboard/discover",
    icon: Compass,
    section: "Startups",
  },
  {
    title: "Wishlist",
    href: "/dashboard/investor/wishlist",
    icon: Star,
    section: "Investor",
    requiredRoles: ["investor", "admin"],
  },
  {
    title: "Opportunities",
    href: "/dashboard/investor/opportunities",
    icon: Zap,
    section: "Investor",
    requiredRoles: ["investor", "admin"],
  },
  {
    title: "Admin Panel",
    href: "/admin",
    icon: Rocket,
    section: "Admin",
    requiredRoles: ["admin"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    section: "System",
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("user")
  const supabase = createClientComponentClient()
  const { state, toggleSidebar, isMobile } = useSidebar();
  
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("*, roles(name)")
        .eq("id", user.id)
        .single()

      if (data) {
        setProfile(data)
        setUserRole(data.roles?.name || "user")
      }
    }

    fetchProfile()
  }, [supabase])

  const filteredNavItems = navItems.filter(item =>
    !item.requiredRoles || item.requiredRoles.includes(userRole))

  const groupedNavItems = filteredNavItems.reduce((acc, item) => {
    const section = item.section || "Other"
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === "/dashboard") return pathname === href
    if (href === "/admin") return pathname.startsWith(href)
    if (href === "/dashboard/startups") return pathname.startsWith(href)
    return pathname === href
  }

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      <Sidebar 
        variant="floating" 
        className="border-0"
        collapsible="icon"
        side="left"
      >
        <SidebarHeader className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">LaunchPad</span>
              <span className="text-xs text-muted-foreground">Startup Dashboard</span>
            </div>
          </div>
          
          {/* Custom toggle button to enhance visibility */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="hidden md:flex h-8 w-8 rounded-full bg-muted"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", state === "collapsed" && "rotate-180")} />
          </Button>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          {Object.entries(groupedNavItems).map(([section, items]) => (
            <SidebarGroup key={section}>
              <SidebarGroupLabel>{section}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                        className="gap-3"
                      >
                        <Link href={item.href}>
                          <div className="flex h-5 w-5 items-center justify-center">
                            <item.icon className="h-[18px] w-[18px]" />
                          </div>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="mt-auto p-4">
          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage src={profile?.avatar_url} alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {profile?.full_name || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {profile?.roles?.name || "User"}
                </span>
              </div>
            </div>
            <Link href="/dashboard/settings">
              <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </div>
        </SidebarFooter>

        {/* Make sure rail is visible */}
        <SidebarRail className="after:bg-border hover:after:bg-foreground/30" />
      </Sidebar>
    </>
  )
}