"use client"

import Link from "next/link"
import { LogOut, Settings, User, Laptop, ShieldCheck } from "lucide-react"
import { Database } from "@/types/database"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  roles?: {
    name: string
  } | null
}

interface UserAccountNavProps {
  profile: Profile
  userEmail?: string
  userRole?: string
}

export function UserAccountNav({ profile, userEmail, userRole }: UserAccountNavProps) {
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((name) => name[0]).join("")
    : userEmail?.[0] || "U"

  const isAdmin = userRole === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User avatar"} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4 border-b">
          <div className="flex flex-col space-y-1">
            <p className="text-base font-semibold leading-none">{profile?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            {userRole && (
              <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <div className="p-2">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="px-4 py-2 cursor-pointer">
              <Link href="/dashboard">
                <Laptop className="mr-3 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-4 py-2 cursor-pointer">
              <Link href="/dashboard/profile">
                <User className="mr-3 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="px-4 py-2 cursor-pointer">
              <Link href="/dashboard/settings">
                <Settings className="mr-3 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            
            {isAdmin && (
              <DropdownMenuItem asChild className="px-4 py-2 cursor-pointer">
                <Link href="/admin">
                  <ShieldCheck className="mr-3 h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <DropdownMenuItem asChild className="px-4 py-2 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
            <form action="/api/auth/signout" method="post" className="w-full">
              <button type="submit" className="flex w-full items-center">
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 