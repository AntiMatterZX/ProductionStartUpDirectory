import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  try {
    // Create a Supabase client configured to use cookies
    // In Next.js 15, we need to use async/await with cookie operations
    const supabase = createMiddlewareClient<Database>({ 
      req: request, 
      res: response 
    })

    // Refresh session if expired - required for Server Components
    // First get session which is needed for middleware operation
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // For security verification, also get the user from Supabase Auth server
    // This is more secure than just relying on the cookie-based session
    const { data: { user } } = session 
      ? await supabase.auth.getUser() 
      : { data: { user: null } }

    // If session exists but user verification failed, sign out as it could be a security issue
    if (session && !user) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Auth routes - redirect to dashboard if already authenticated
    if (user && (pathname === "/login" || pathname === "/signup" || pathname === "/reset-password")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Protected routes - redirect to login if not authenticated
    if (!user && pathname.startsWith("/dashboard")) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If authenticated user, check role-based access
    if (user && (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/admin"))) {
      try {
        // Get profile with roles in a single query
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*, roles(name)")
          .eq("id", user.id)
          .single()
        
        // If not admin role
        if (!profile || !profile.roles || profile.roles.name !== "admin") {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } catch (error) {
        // On error, default to non-admin access
        console.error("Error checking admin role:", error);
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  } catch (error) {
    console.error("Middleware error:", error);
    // On critical error, redirect to login
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

// Specify which routes this middleware should apply to
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
