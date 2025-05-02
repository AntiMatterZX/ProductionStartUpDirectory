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
    title: "Explore",
    sublinks: [
      { title: "Featured Startups", href: "/startups" },
      { title: "Latest Additions", href: "/startups/latest" },
      { title: "Top Funded", href: "/startups/top-funded" },
      { title: "Trending", href: "/startups/trending" },
    ],
  },
  {
    title: "Categories",
    sublinks: [
      { title: "SaaS", href: "/startups/category/saas" },
      { title: "Fintech", href: "/startups/category/fintech" },
      { title: "Healthcare", href: "/startups/category/healthcare" },
      { title: "AI & ML", href: "/startups/category/ai-ml" },
      { title: "Blockchain", href: "/startups/category/blockchain" },
      { title: "E-commerce", href: "/startups/category/ecommerce" },
    ],
  },
  {
    title: "Investors",
    sublinks: [
      { title: "Angel Investors", href: "/investors/angel" },
      { title: "VC Firms", href: "/investors/vc" },
      { title: "Corporate Investors", href: "/investors/corporate" },
      { title: "Investment Portfolio", href: "/investors/portfolio" },
    ],
  },
  {
    title: "Resources",
    sublinks: [
      { title: "Startup Guide", href: "/resources/guide" },
      { title: "Pitch Deck Templates", href: "/resources/pitch-decks" },
      { title: "Funding Advice", href: "/resources/funding" },
      { title: "Success Stories", href: "/resources/success-stories" },
    ],
  },
  {
    title: "About",
    sublinks: [
      { title: "Our Mission", href: "/about/mission" },
      { title: "How It Works", href: "/about/how-it-works" },
      { title: "Contact Us", href: "/contact" },
      { title: "FAQ", href: "/faq" },
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
        
        <footer className="border-t py-8 bg-background">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <Logo />
              <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} VentureConnect. All rights reserved.
              </div>
              <div className="mt-4 md:mt-0 flex gap-4">
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
          </div>
        </footer>
      </RoundedDrawerNav>
    </div>
  )
}
