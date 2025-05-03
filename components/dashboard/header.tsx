"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User } from "@supabase/supabase-js"
import { Bell, MessageSquare, Search, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { useSidebar } from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [profile, setProfile] = useState<any>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const { isMobile, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  
  // Check if we're not on the main dashboard page to show back button
  const showBackButton = pathname && pathname !== "/dashboard" 
  
  useEffect(() => {
    // Track scrolling for header appearance
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    
    // Fetch user profile
    const fetchProfile = async () => {
      const supabase = createClientComponentClient()
      const { data } = await supabase
        .from("profiles")
        .select("*, roles(name)")
        .eq("id", user.id)
        .single()
        
      if (data) {
        setProfile(data)
      }
    }
    
    fetchProfile()
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [user.id])
  
  const handleSignOut = async () => {
    const supabase = createClientComponentClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }
  
  const userRole = profile?.roles?.name || "user"
  const initials = profile?.full_name 
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() 
    : user.email?.substring(0, 2).toUpperCase() || "UN"

  const goBack = () => {
    router.back()
  }

  return (
    <header className={cn(
      "sticky top-0 z-30 w-full transition-all duration-200",
      "bg-gray-50 dark:bg-gray-900 border-b shadow-sm"
    )}>
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Left section - Back button or hamburger space */}
        <div className="flex items-center min-w-[40px]">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={goBack} 
              className="mr-2 rounded-full"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Page title - Only shows on non-dashboard pages */}
        <div className="flex-1 flex justify-start ml-2">
          {pathname && pathname.includes('/dashboard/startups/create') && (
            <h1 className="text-lg font-medium">Create Startup</h1>
          )}
          {pathname && pathname.includes('/dashboard/settings') && (
            <h1 className="text-lg font-medium">Settings</h1>
          )}
          {pathname && pathname.includes('/dashboard/startups') && !pathname.includes('create') && (
            <h1 className="text-lg font-medium">My Startups</h1>
          )}
        </div>
        
        {/* Search field - Only on desktop */}
        <div className="hidden md:flex items-center justify-center">
          <form className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 bg-background/60 w-[240px] lg:w-[320px] border-muted"
            />
          </form>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center ml-auto">
          <div className="hidden sm:flex items-center">
            <ModeToggle />
            
            <Button variant="ghost" size="icon" className="relative ml-2">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
            
            <Button variant="ghost" size="icon" className="ml-2">
              <MessageSquare className="h-5 w-5" />
              <span className="sr-only">Messages</span>
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || user.email || ""} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/startups">My Startups</Link>
              </DropdownMenuItem>
              
              {(userRole === "investor" || userRole === "admin") && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/investor/wishlist">Wishlist</Link>
                </DropdownMenuItem>
              )}
              
              {userRole === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin Panel</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 