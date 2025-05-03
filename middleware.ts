import { type NextRequest, NextResponse } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes and static assets without any auth checks
  // This prevents redirect loops for most routes
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/startups',
    '/docs'
  ]
  
  // Skip middleware completely for these paths
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next()
  }

  // Only apply auth protection to dashboard paths
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const response = NextResponse.next()
    
    try {
      // Create a Supabase client configured to use cookies
      const supabase = createMiddlewareClient<Database>({ 
        req: request, 
        res: response 
      })

      // Get session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Redirect to login if no session for protected routes
      if (!session) {
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // For admin routes, check role-based access
      if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/admin")) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*, roles(name)")
            .eq("id", session.user.id)
            .single()
          
          // If not admin role
          if (!profile || !profile.roles || profile.roles.name !== "admin") {
            return NextResponse.redirect(new URL("/dashboard", request.url))
          }
        } catch (error) {
          console.error("Error checking admin role:", error);
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      }
      
      return response
    } catch (error) {
      console.error("Middleware error:", error);
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // For all other routes, just continue without auth checks
  return NextResponse.next()
}

// Modify the matcher to be more selective
export const config = {
  matcher: [
    // Protected routes that need auth
    '/dashboard/:path*',
    '/admin/:path*',
    // Auth routes that need session checks for redirects
    '/login',
    '/signup',
    '/reset-password',
  ],
}
