import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/database"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect") || "/dashboard"

  if (code) {
    try {
      // Create the Supabase client with cookies
      const supabase = createRouteHandlerClient<Database>({ cookies })
      
      // Exchange code for session
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error("Error exchanging code for session:", sessionError);
        // Redirect to login on error
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Authentication failed")}`, request.url))
      }

      // Get user data after successful auth
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("Error getting user after authentication:", userError);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Failed to get user data")}`, request.url))
      }

      try {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (!existingProfile) {
          // Get default 'user' role id
          const { data: userRoleData } = await supabase
            .from("roles")
            .select("id")
            .eq("name", "user")
            .single()

          // Create profile
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              role_id: userRoleData?.id,
            })

          if (profileError) {
            console.error("Error creating user profile:", profileError);
            // Continue anyway - we'll handle this separately, don't block login
          }
        }
      } catch (profileError) {
        console.error("Error handling user profile:", profileError);
        // We don't want profile errors to block authentication
        // Just log and continue
      }
    } catch (error) {
      console.error("General error in auth callback:", error);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Authentication error occurred")}`, request.url))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(redirect, request.url))
}
