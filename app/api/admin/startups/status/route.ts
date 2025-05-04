import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server-component";
import { cookies } from "next/headers";
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from "next/cache";

// Admin-only endpoint to update startup status
export async function POST(request: NextRequest) {
  try {
    // First authenticate with the normal client to check admin status
    const supabase = await createServerComponentClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
      
    if (profileError || !profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }
    
    if (profile.role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    
    // Get request data
    const body = await request.json();
    const { startupId, status } = body;
    
    if (!startupId || !status) {
      return NextResponse.json({ message: "Missing startupId or status" }, { status: 400 });
    }
    
    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }
    
    // Create a service role client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Get the current startup data
    const { data: startup, error: fetchError } = await supabaseAdmin
      .from("startups")
      .select("id, name, slug")
      .eq("id", startupId)
      .single();
      
    if (fetchError || !startup) {
      return NextResponse.json({ message: "Startup not found" }, { status: 404 });
    }
    
    // Update the startup status using service role
    const { error: updateError } = await supabaseAdmin
      .from("startups")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", startupId);
      
    if (updateError) {
      console.error("Error updating startup status:", updateError);
      return NextResponse.json({ message: "Error updating status", error: updateError.message }, { status: 500 });
    }
    
    // Log the action
    await supabaseAdmin.from("audit_log").insert({
      user_id: session.user.id,
      action: `status_change_to_${status}`,
      entity_type: "startup",
      entity_id: startupId,
      details: { name: startup.name }
    });
    
    // Revalidate paths
    revalidatePath('/admin/moderation');
    if (startup.slug) {
      revalidatePath(`/startups/${startup.slug}`);
    }
    
    return NextResponse.json({ 
      message: "Status updated successfully", 
      status,
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error in admin status update:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 