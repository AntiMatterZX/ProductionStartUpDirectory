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
  Rocket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DashboardSidebar() {
  const [open, setOpen] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname() ?? ""
  const supabase = createClientComponentClient()
  
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
      setOpen(window.innerWidth >= 1024)
    }

    fetchProfile()
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [supabase])

  const userRole = profile?.roles?.name || "user"
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

  return (
    <motion.aside
      animate={{ width: open ? 240 : 80 }}
      className={cn(
        "fixed lg:relative left-0 top-0 h-screen z-50 bg-background border-r shadow-sm",
        "flex flex-col overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b relative">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-2 bg-primary rounded-lg text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </div>
          <AnimatePresence initial={false}>
            {open && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold truncate"
              >
                LaunchPad
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 absolute -right-3 top-4 bg-background border shadow-sm"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            !open && "rotate-180"
          )}/>
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" open={open} active={isActive("/dashboard")} />
          <NavItem href="/dashboard/startups" icon={Package} label="My Startups" open={open} active={isActive("/dashboard/startups")} />
          <NavItem href="/dashboard/startups/create" icon={FilePlus} label="Create Startup" open={open} active={isActive("/dashboard/startups/create")} />
          <NavItem href="/dashboard/discover" icon={Compass} label="Discover" open={open} active={isActive("/dashboard/discover")} />

          {(userRole === "investor" || userRole === "admin") && (
            <>
              <SectionLabel label="Investor" open={open} />
              <NavItem href="/dashboard/investor/wishlist" icon={Star} label="Wishlist" open={open} active={isActive("/dashboard/investor/wishlist")} />
              <NavItem href="/dashboard/investor/opportunities" icon={Zap} label="Opportunities" open={open} active={isActive("/dashboard/investor/opportunities")} />
            </>
          )}

          {userRole === "admin" && (
            <>
              <SectionLabel label="Admin" open={open} />
              <NavItem href="/admin" icon={Home} label="Admin Panel" open={open} active={isActive("/admin")} />
            </>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <p className="truncate font-medium text-sm">{profile?.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{userRole}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link 
            href="/dashboard/settings" 
            className={cn(
              "shrink-0 text-muted-foreground hover:text-foreground transition-colors",
              !open && "opacity-0 pointer-events-none"
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </motion.aside>
  )
}

function NavItem({ href, icon: Icon, label, open, active }: { 
  href: string
  icon: any
  label: string
  open: boolean
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
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

function SectionLabel({ label, open }: { label: string; open: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="px-3 pt-4 text-xs font-medium text-muted-foreground"
        >
          {label}
        </motion.div>
      ) : (
        <div className="h-4 border-t my-4" />
      )}
    </AnimatePresence>
  )
}