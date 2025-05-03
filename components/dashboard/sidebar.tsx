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

export function DashboardSidebar() {
  const [open, setOpen] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname() ?? ""
  
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
    
    // Close sidebar on mobile
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false)
      } else {
        setOpen(true)
      }
    }
    
    handleResize()
    window.addEventListener("resize", handleResize)
    
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])
  
  const userRole = profile?.roles?.name || "user"

  return (
    <AnimatePresence initial={false}>
      <motion.aside
        initial={{ width: open ? 240 : 70 }}
        animate={{ width: open ? 240 : 70 }}
        exit={{ width: 70 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-screen z-20 bg-card border-r shadow-sm transition-all duration-300",
          "lg:relative"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-3">
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="full-logo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">LaunchPad</span>
                </motion.div>
              ) : (
                <motion.div
                  key="icon-logo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center"
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Rocket className="h-4 w-4" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!open)}
              className="h-8 w-8"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", !open && "rotate-180")} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid gap-1 px-2">
              <NavItem 
                href="/dashboard" 
                icon={LayoutDashboard} 
                label="Dashboard" 
                isActive={pathname === "/dashboard"} 
                isOpen={open} 
              />
              <NavItem 
                href="/dashboard/startups" 
                icon={Package} 
                label="My Startups" 
                isActive={pathname.startsWith("/dashboard/startups")} 
                isOpen={open} 
              />
              <NavItem 
                href="/dashboard/startups/create" 
                icon={FilePlus} 
                label="Create Startup" 
                isActive={pathname === "/dashboard/startups/create"} 
                isOpen={open} 
              />
              <NavItem 
                href="/dashboard/discover" 
                icon={Compass} 
                label="Discover" 
                isActive={pathname === "/dashboard/discover"} 
                isOpen={open} 
              />
              
              {/* Conditional items based on role */}
              {(userRole === "investor" || userRole === "admin") && (
                <>
                  <div className={cn("my-2 px-3", !open && "px-0 py-2")}>
                    {open && <p className="text-xs font-medium text-muted-foreground">Investor</p>}
                    {!open && <hr className="border-t border-border" />}
                  </div>
                  <NavItem 
                    href="/dashboard/investor/wishlist" 
                    icon={Star} 
                    label="Wishlist" 
                    isActive={pathname === "/dashboard/investor/wishlist"} 
                    isOpen={open} 
                  />
                  <NavItem 
                    href="/dashboard/investor/opportunities" 
                    icon={Zap} 
                    label="Opportunities" 
                    isActive={pathname === "/dashboard/investor/opportunities"} 
                    isOpen={open} 
                  />
                </>
              )}
              
              {/* Admin section */}
              {userRole === "admin" && (
                <>
                  <div className={cn("my-2 px-3", !open && "px-0 py-2")}>
                    {open && <p className="text-xs font-medium text-muted-foreground">Admin</p>}
                    {!open && <hr className="border-t border-border" />}
                  </div>
                  <NavItem 
                    href="/admin" 
                    icon={Home} 
                    label="Admin Panel" 
                    isActive={pathname.startsWith("/admin")} 
                    isOpen={open} 
                  />
                </>
              )}
            </nav>
          </div>
          
          <div className="mt-auto border-t p-2">
            <NavItem 
              href="/dashboard/settings" 
              icon={Settings} 
              label="Settings" 
              isActive={pathname === "/dashboard/settings"} 
              isOpen={open} 
            />
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

interface NavItemProps {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  isOpen: boolean
  children?: React.ReactNode
}

function NavItem({ href, icon: Icon, label, isActive, isOpen }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-accent text-accent-foreground hover:bg-accent/80" 
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.span
            key={label}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
} 