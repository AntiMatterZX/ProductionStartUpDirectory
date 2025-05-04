import type React from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth/auth"
import { Logo } from "@/components/ui/logo"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Use the utility function to check authentication
  const { user } = await getAuthUser()
  
  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md px-4">{children}</div>
      </main>

      <footer className="bg-background border-t border-border w-full py-4 mt-auto">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LaunchPad. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
