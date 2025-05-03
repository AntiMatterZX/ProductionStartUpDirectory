import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with service role for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
    }
  }
);

// Generate a UUID for the social links
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// This handler updates social links for a startup
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startupId = params.id;
  
  try {
    // Parse request
    let socialLinks;
    try {
      const requestData = await request.json();
      socialLinks = requestData.socialLinks;
      
      if (!socialLinks) {
        return NextResponse.json(
          { error: "Social links data is required" },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error("Error parsing request data:", parseError);
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    
    // Delete existing links
    await supabaseAdmin
      .from("social_links")
      .delete()
      .eq("startup_id", startupId);
    
    // Insert new links
    const linksToAdd = [];
    
    if (socialLinks.linkedin && socialLinks.linkedin.trim() !== "") {
      linksToAdd.push({
        id: generateUUID(),
        startup_id: startupId,
        platform: "linkedin",
        url: socialLinks.linkedin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    if (socialLinks.twitter && socialLinks.twitter.trim() !== "") {
      linksToAdd.push({
        id: generateUUID(),
        startup_id: startupId,
        platform: "twitter",
        url: socialLinks.twitter,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    if (linksToAdd.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("social_links")
        .insert(linksToAdd);
      
      if (insertError) {
        console.error("Error inserting social links:", insertError);
        return NextResponse.json(
          { error: "Failed to insert social links", details: insertError },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true, count: linksToAdd.length });
    
  } catch (error) {
    console.error("Error handling social links:", error);
    return NextResponse.json(
      { error: "Server error processing social links" },
      { status: 500 }
    );
  }
} 