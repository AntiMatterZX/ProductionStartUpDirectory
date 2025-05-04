import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Create a Supabase client with the service role key (admin privileges)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Verify the user has admin privileges
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is an admin using the profiles table with role_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error("Admin access check failed - profile error:", profileError);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
    
    // Check if the user has the admin role (role_id 4)
    const isAdmin = profile?.role_id === 4;
    
    if (!isAdmin) {
      console.error("Admin access check failed - not admin role:", profile?.role_id);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
    
    // Parse query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    
    // Use the admin client to fetch startups (bypasses RLS)
    let query = supabaseAdmin.from('startups').select(`
      *,
      categories(id, name)
    `)
    
    // Filter by status if specified
    if (status !== 'all') {
      query = query.eq('status', status)
    }
    
    // Get the startups
    const { data: startups, error } = await query
    
    if (error) {
      console.error("Error fetching startups:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ startups })
    
  } catch (error: any) {
    console.error("Admin API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Update startup status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    // Verify the user has admin privileges
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Check if user is an admin using the profiles table with role_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error("Admin access check failed - profile error:", profileError);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
    
    // Check if the user has the admin role (role_id 4)
    const isAdmin = profile?.role_id === 4;
    
    if (!isAdmin) {
      console.error("Admin access check failed - not admin role:", profile?.role_id);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
    
    // Get the request body
    const { startup_id, status } = await request.json()
    
    if (!startup_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Validate status value
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }
    
    // Use the admin client to update the startup (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('startups')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', startup_id)
      .select('id, name, status')
      .single()
    
    if (error) {
      console.error("Error updating startup status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Log the action
    await supabaseAdmin.from('audit_log').insert({
      user_id: session.user.id,
      action: `set_status_${status}`,
      entity_type: 'startup',
      entity_id: startup_id,
      details: { status }
    })
    
    return NextResponse.json({ 
      message: `Startup ${data.name} has been ${status}`,
      startup: data
    })
    
  } catch (error: any) {
    console.error("Admin API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 