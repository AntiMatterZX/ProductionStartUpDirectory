import type React from "react"
import Link from "next/link"
import { getAuthUserWithRole } from "@/lib/auth/auth"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { UserAccountNav } from "@/components/ui/user-account-nav"
import { RoundedDrawerNav } from "@/components/ui/rounded-drawer-nav"

// Define startup categories and related navigation links
const startupCategories = [
  {
    title: "Startups",
    sublinks: [
      { title: "All Startups", href: "/startups" },
      { title: "Top 5", href: "/startups/top" },
      { title: "Categories", href: "/startups/categories" },
      { title: "Create Startup", href: "/dashboard/startups/create" },
    ],
  },
  {
    title: "About",
    sublinks: [
      { title: "Our Mission", href: "/about/mission" },
      { title: "How It Works", href: "/about/how-it-works" },
      { title: "Team", href: "/about/team" },
      { title: "Contact Us", href: "/contact" },
    ],
  },
];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Use the utility function to get authenticated user and role information
  // This uses the recommended pattern from Supabase for secure authentication
  const { user, profile, role } = await getAuthUserWithRole()

  return (
    <div className="flex flex-col min-h-screen">
      <RoundedDrawerNav 
        links={startupCategories}
        navBackground="bg-background dark:bg-zinc-900"
        bodyBackground="bg-background"
        user={user}
        userRole={role}
      >
        <main className="flex-1">{children}</main>
        
        <footer className="border-t border-border py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} LaunchPad. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </RoundedDrawerNav>
    </div>
  )
}
