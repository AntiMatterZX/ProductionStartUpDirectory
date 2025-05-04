import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"

// Status update handler with admin notifications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get request data
    const body = await request.json()
    const { startupId, status } = body
    
    if (!startupId || !status) {
      return NextResponse.json({ message: "Missing startupId or status" }, { status: 400 })
    }
    
    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 })
    }
    
    // Get the current startup data
    const { data: startup, error: fetchError } = await supabase
      .from("startups")
      .select("*, profiles(full_name, email)")
      .eq("id", startupId)
      .single()
      
    if (fetchError || !startup) {
      return NextResponse.json({ message: "Startup not found" }, { status: 404 })
    }
    
    // Only let users modify their own startups
    if (startup.user_id !== session.user.id) {
      return NextResponse.json({ message: "You can only update your own startups" }, { status: 403 })
    }
    
    // Update the startup status
    const { error: updateError } = await supabase
      .from("startups")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", startupId)
      
    if (updateError) {
      console.error("Error updating startup status:", updateError)
      return NextResponse.json({ message: "Error updating status" }, { status: 500 })
    }
    
    // Create an activity log entry
    await supabase.from("activity_logs").insert({
      user_id: session.user.id,
      startup_id: startupId,
      action: `Status changed to ${status}`,
      created_at: new Date().toISOString()
    })
    
    // Send email notification for important status changes
    if (status === "approved") {
      try {
        // Notify admin about the approval
        await sendEmail({
          to: process.env.ADMIN_EMAIL || "admin@example.com",
          subject: `Startup Approved: ${startup.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Startup Status Changed</h2>
              <p>A startup has been approved:</p>
              <ul>
                <li><strong>Name:</strong> ${startup.name}</li>
                <li><strong>ID:</strong> ${startup.id}</li>
                <li><strong>Status:</strong> Approved</li>
                <li><strong>Updated at:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              <p>The startup is now visible to the public.</p>
            </div>
          `
        })
      } catch (emailError) {
        // Log but don't fail if email fails
        console.error("Error sending status update email:", emailError)
      }
    }
    
    // Revalidate paths to ensure updated data is shown
    revalidatePath(`/startups/${startup.slug}`)
    revalidatePath('/dashboard/startups')
    revalidatePath(`/dashboard/startups/${startupId}`)
    
    return NextResponse.json({ 
      message: "Status updated successfully", 
      status,
    }, { status: 200 })
    
  } catch (error) {
    console.error("Error in POST /api/startups/status:", error)
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 