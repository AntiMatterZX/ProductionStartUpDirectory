"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  Shield, 
  AlertTriangle,
  Megaphone,
  BarChart3,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  const routes = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />,
      href: "/admin/dashboard",
    },
    {
      label: "Users",
      icon: <Users className="h-5 w-5 mr-3" />,
      href: "/admin/users",
    },
    {
      label: "Startups",
      icon: <Building2 className="h-5 w-5 mr-3" />,
      href: "/admin/startups",
    },
    {
      label: "Moderation",
      icon: <Shield className="h-5 w-5 mr-3" />,
      href: "/admin/moderation",
      subItems: [
        {
          label: "Main Dashboard",
          href: "/admin/moderation",
        },
        {
          label: "Spam Management",
          href: "/admin/moderation/spam",
        },
        {
          label: "Client View",
          href: "/admin/moderation/client-view",
        }
      ]
    },
    {
      label: "Content",
      icon: <Layers className="h-5 w-5 mr-3" />,
      href: "/admin/content",
    },
    {
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5 mr-3" />,
      href: "/admin/analytics",
    },
    {
      label: "Announcements",
      icon: <Megaphone className="h-5 w-5 mr-3" />,
      href: "/admin/announcements",
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5 mr-3" />,
      href: "/admin/settings",
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm overflow-y-auto">
        <div className="px-4 py-5">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
          </div>
        </div>
        <Separator />
        <nav className="px-2 py-3">
          <div className="space-y-1">
            {routes.map((route) => (
              <div key={route.href}>
                <Button
                  asChild
                  variant={isActive(route.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1 font-medium",
                    isActive(route.href) && "bg-primary/10"
                  )}
                >
                  <Link href={route.href}>
                    {route.icon}
                    {route.label}
                  </Link>
                </Button>
                
                {/* Sub-items if any */}
                {route.subItems && isActive(route.href) && (
                  <div className="ml-7 space-y-1 mb-2">
                    {route.subItems.map((subItem) => (
                      <Button
                        key={subItem.href}
                        asChild
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start h-8 font-normal text-sm",
                          pathname === subItem.href && "bg-primary/5 font-medium"
                        )}
                      >
                        <Link href={subItem.href}>{subItem.label}</Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 