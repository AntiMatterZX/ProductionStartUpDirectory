"use client"

import type * as React from "react"
import Link from "next/link"
import { BarChart3, FileText, Home, LayoutDashboard, Package, Settings, ShoppingCart, Users } from "lucide-react"
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
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  isActive?: boolean
  badge?: number
  section?: string
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
    section: "Main",
  },
  {
    title: "Home",
    href: "/",
    icon: Home,
    section: "Main",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    section: "Main",
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    badge: 12,
    section: "Management",
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    section: "Management",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    section: "Management",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    section: "System",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    section: "System",
  },
]

export function AdminSidebar() {
  // Group nav items by section
  const groupedNavItems = navItems.reduce(
    (acc, item) => {
      const section = item.section || "Other"
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(item)
      return acc
    },
    {} as Record<string, NavItem[]>,
  )

  return (
    <Sidebar variant="floating" className="border-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Acme Admin</span>
            <span className="text-xs text-muted-foreground">Enterprise Dashboard</span>
          </div>
        </div>
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
                    <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title} className="gap-3">
                      <Link href={item.href}>
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
        ))}
      </SidebarContent>

      <SidebarFooter className="mt-auto p-4">
        <div className="flex items-center justify-between rounded-xl bg-muted p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src="/avatar.png" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">John Doe</span>
              <span className="text-xs text-muted-foreground">Administrator</span>
            </div>
          </div>
          <Link href="/settings/profile">
            <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
} 