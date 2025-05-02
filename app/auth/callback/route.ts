import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/database"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect") || "/dashboard"

  if (code) {
    // Create the Supabase client with cookies
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    await supabase.auth.exchangeCodeForSession(code)

    // Upsert profile for OAuth users
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
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

        await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            role_id: userRoleData?.id,
          })
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(redirect, request.url))
}
