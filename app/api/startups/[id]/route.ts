import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { generateSlug } from "@/lib/utils/helpers/slug-generator"
import { uploadFile } from "@/lib/utils/helpers/file-upload"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startupId = params.id
  
  try {
    const formData = await request.formData()
    
    const basicInfoStr = formData.get("basicInfo") as string
    const detailedInfoStr = formData.get("detailedInfo") as string
    const mediaInfoStr = formData.get("mediaInfo") as string
    
    if (!basicInfoStr || !detailedInfoStr || !mediaInfoStr) {
      return NextResponse.json({ message: "Missing required data" }, { status: 400 })
    }
    
    const basicInfo = JSON.parse(basicInfoStr)
    const detailedInfo = JSON.parse(detailedInfoStr)
    const mediaInfo = JSON.parse(mediaInfoStr)

    // Get files if present
    const logo = formData.get("logo") as File | null
    const coverImage = formData.get("coverImage") as File | null
    const pitchDeck = formData.get("pitchDeck") as File | null

    // Add them back to mediaInfo for processing
    if (logo) mediaInfo.logo = logo
    if (coverImage) mediaInfo.coverImage = coverImage
    if (pitchDeck) mediaInfo.pitchDeck = pitchDeck

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }
    
    // Check if the startup exists and belongs to the user
    const { data: existingStartup, error: fetchError } = await supabase
      .from("startups")
      .select("user_id")
      .eq("id", startupId)
      .single()
    
    if (fetchError || !existingStartup) {
      return NextResponse.json({ message: "Startup not found" }, { status: 404 })
    }
    
    if (existingStartup.user_id !== session.user.id) {
      return NextResponse.json({ message: "You don't have permission to edit this startup" }, { status: 403 })
    }
    
    // Process data for update
    const updateData: any = {
      name: basicInfo.name,
      description: detailedInfo.description,
      website_url: basicInfo.website,
      founding_date: basicInfo.foundingDate,
      employee_count: detailedInfo.teamSize ? Number.parseInt(detailedInfo.teamSize) : null,
      funding_stage: detailedInfo.fundingStage,
      funding_amount: detailedInfo.fundingAmount ? Number.parseFloat(detailedInfo.fundingAmount) : null,
      location: detailedInfo.location,
      category_id: basicInfo.industry,
      updated_at: new Date().toISOString()
    }
    
    console.log("Updating startup with data:", updateData);
    
    // If slug was changed, generate a new one
    if (basicInfo.slug) {
      updateData.slug = generateSlug(basicInfo.slug)
    }
    
    // Handle file uploads
    let logoUrl = null;
    let coverImageUrl = null;
    let pitchDeckUrl = null;
    const mediaEntries = [];

    if (logo) {
      try {
        const logoFile = logo as File;
        // Use the shared uploadFile helper instead of duplicate code
        logoUrl = await uploadFile(
          logoFile,
          session.user.id,
          "logo",
          (progress: number) => {
            // No progress handling needed here
          }
        );
        
        if (logoUrl) {
          // Delete existing logo
          await supabase
            .from("startup_media")
            .delete()
            .eq("startup_id", startupId)
            .eq("media_type", "logo");
          
          // Add new logo
          mediaEntries.push({
            startup_id: startupId,
            media_type: "logo",
            url: logoUrl,
            title: "Logo",
            is_featured: true,
          });
        }
      } catch (logoError) {
        console.error("Error uploading logo:", logoError);
        // Continue without logo update
      }
    }

    if (coverImage) {
      try {
        const coverFile = coverImage as File;
        // Use the shared uploadFile helper
        coverImageUrl = await uploadFile(
          coverFile,
          session.user.id,
          "banner",
          (progress: number) => {
            // No progress handling needed here
          }
        );
        
        if (coverImageUrl) {
          // Delete existing featured image
          await supabase
            .from("startup_media")
            .delete()
            .eq("startup_id", startupId)
            .eq("media_type", "image")
            .eq("is_featured", true);
          
          // Add new featured image
          mediaEntries.push({
            startup_id: startupId,
            media_type: "image",
            url: coverImageUrl,
            title: "Cover Image",
            is_featured: true,
          });
        }
      } catch (coverError) {
        console.error("Error uploading cover image:", coverError);
        // Continue without cover image update
      }
    }
    
    if (pitchDeck) {
      try {
        const deckFile = pitchDeck as File;
        // Use the shared uploadFile helper
        pitchDeckUrl = await uploadFile(
          deckFile,
          session.user.id,
          "pitch_deck",
          (progress: number) => {
            // No progress handling needed here
          }
        );
        
        if (pitchDeckUrl) {
          // Delete existing pitch deck
          await supabase
            .from("startup_media")
            .delete()
            .eq("startup_id", startupId)
            .eq("media_type", "document")
            .eq("title", "Pitch Deck");
          
          // Add new pitch deck
          mediaEntries.push({
            startup_id: startupId,
            media_type: "document",
            url: pitchDeckUrl,
            title: "Pitch Deck",
            is_featured: false,
          });
        }
      } catch (deckError) {
        console.error("Error uploading pitch deck:", deckError);
        // Continue without pitch deck update
      }
    }
    
    // Update the startup record with full selection of fields
    const { data: updatedStartup, error: updateError } = await supabase
      .from("startups")
      .update(updateData)
      .eq("id", startupId)
      .select("*")
      .single()
    
    if (updateError) {
      console.error("Error updating startup:", updateError)
      return NextResponse.json({ message: "Failed to update startup", error: updateError.message }, { status: 500 })
    }
    
    console.log("Successfully updated startup:", updatedStartup);
    
    // Handle looking_for options - update the array directly
    if (detailedInfo.lookingFor && detailedInfo.lookingFor.length > 0) {
      const { error: lookingForError } = await supabase
        .from("startups")
        .update({ looking_for: detailedInfo.lookingFor })
        .eq("id", startupId)
      
      if (lookingForError) {
        console.error("Error updating looking_for options:", lookingForError)
      }
    }
    
    // Handle social links - but skip this entirely if there are RLS issues
    if (mediaInfo.socialLinks) {
      try {
        // Try a simple test operation to see if we have permissions
        const testResult = await supabase
          .from("social_links")
          .select("count")
          .eq("startup_id", startupId)
          .limit(1);
        
        // Only proceed if the test was successful (no RLS issues)
        if (!testResult.error) {
          console.log("Social links test succeeded, proceeding with update");
          
          // First try to delete all existing links
          const { error: deleteError } = await supabase
            .from("social_links")
            .delete()
            .eq("startup_id", startupId);
            
          if (!deleteError) {
            // If delete worked, try to insert new links
            const socialLinksData = Object.entries(mediaInfo.socialLinks)
              .filter(([_, url]) => url && (url as string).trim() !== "")
              .map(([platform, url]) => ({
                id: uuidv4(),
                startup_id: startupId,
                platform,
                url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
            if (socialLinksData.length > 0) {
              await supabase
                .from("social_links")
                .insert(socialLinksData);
              // Ignore errors here - we've already tested permissions
            }
          }
        } else {
          console.log("Social links test failed - skipping social links update due to RLS restrictions");
        }
      } catch (error) {
        console.error("Exception handling social links - continuing without updating them:", error);
      }
    }
    
    // Handle media uploads for cover image and pitch deck
    if (coverImage || pitchDeck || mediaInfo.videoUrl) {
      const mediaEntries = []
      
      if (coverImage) {
        const coverFile = coverImage as File
        const coverExt = coverFile.name.split(".").pop()
        const coverPath = `${session.user.id}/${Date.now()}-cover.${coverExt}`
  
        const { data: coverData, error: coverError } = await supabase.storage
          .from("startup-media")
          .upload(coverPath, coverFile, {
            cacheControl: "3600",
            upsert: false,
          })
  
        if (coverError) {
          console.error("Error uploading cover image:", coverError)
        } else {
          const { data: coverUrlData } = supabase.storage.from("startup-media").getPublicUrl(coverPath)
          coverImageUrl = coverUrlData.publicUrl
          
          // Delete existing featured image
          await supabase
            .from("startup_media")
            .delete()
            .eq("startup_id", startupId)
            .eq("media_type", "image")
            .eq("is_featured", true)
          
          // Add new featured image
          mediaEntries.push({
            startup_id: startupId,
            media_type: "image",
            url: coverImageUrl,
            title: "Cover Image",
            is_featured: true,
          })
        }
      }
      
      if (pitchDeck) {
        const deckFile = pitchDeck as File
        const deckExt = deckFile.name.split(".").pop()
        const deckPath = `${session.user.id}/${Date.now()}-deck.${deckExt}`
  
        const { data: deckData, error: deckError } = await supabase.storage
          .from("startup-media")
          .upload(deckPath, deckFile, {
            cacheControl: "3600",
            upsert: false,
          })
  
        if (deckError) {
          console.error("Error uploading pitch deck:", deckError)
        } else {
          const { data: deckUrlData } = supabase.storage.from("startup-media").getPublicUrl(deckPath)
          pitchDeckUrl = deckUrlData.publicUrl
          
          // Delete existing pitch deck
          await supabase
            .from("startup_media")
            .delete()
            .eq("startup_id", startupId)
            .eq("media_type", "document")
            .eq("title", "Pitch Deck")
          
          // Add new pitch deck
          mediaEntries.push({
            startup_id: startupId,
            media_type: "document",
            url: pitchDeckUrl,
            title: "Pitch Deck",
            is_featured: false,
          })
        }
      }
      
      if (mediaInfo.videoUrl) {
        // Delete existing video
        await supabase
          .from("startup_media")
          .delete()
          .eq("startup_id", startupId)
          .eq("media_type", "video")
        
        // Add new video if URL is provided
        if (mediaInfo.videoUrl.trim() !== "") {
          mediaEntries.push({
            startup_id: startupId,
            media_type: "video",
            url: mediaInfo.videoUrl,
            title: "Demo Video",
            is_featured: false,
          })
        }
      }
      
      if (mediaEntries.length > 0) {
        const { error: mediaError } = await supabase
          .from("startup_media")
          .insert(mediaEntries)
        
        if (mediaError) {
          console.error("Error updating media entries:", mediaError)
        }
      }
    }
    
    // Create an audit log entry
    await supabase.from("audit_log").insert({
      user_id: session.user.id,
      action: "update",
      entity_type: "startup",
      entity_id: startupId,
      details: { name: basicInfo.name },
    })
    
    // Fetch complete startup data with all relationships
    const { data: completeStartup, error: completeFetchError } = await supabase
      .from("startups")
      .select(`
        *,
        categories(*)
      `)
      .eq("id", startupId)
      .single();
      
    if (completeFetchError) {
      console.error("Error fetching complete startup data:", completeFetchError);
      // Return success with just the updated startup data
      return NextResponse.json({
        message: "Startup updated successfully",
        id: startupId,
        startup: updatedStartup,
      })
    }
    
    // Return with complete data including relationships
    return NextResponse.json({
      message: "Startup updated successfully",
      id: startupId,
      startup: completeStartup,
    })
  } catch (error: any) {
    console.error("Error in startup update:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startupId = params.id
  
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }
    
    // Check if the startup exists and belongs to the user
    const { data: existingStartup, error: fetchError } = await supabase
      .from("startups")
      .select("user_id")
      .eq("id", startupId)
      .single()
    
    if (fetchError || !existingStartup) {
      return NextResponse.json({ message: "Startup not found" }, { status: 404 })
    }
    
    if (existingStartup.user_id !== session.user.id) {
      return NextResponse.json({ message: "You don't have permission to delete this startup" }, { status: 403 })
    }
    
    // Delete related records first (to maintain referential integrity)
    
    // Delete social links
    await supabase
      .from("social_links")
      .delete()
      .eq("startup_id", startupId)
    
    // Delete media entries
    await supabase
      .from("startup_media")
      .delete()
      .eq("startup_id", startupId)
    
    // Delete startup views 
    await supabase
      .from("startup_views")
      .delete()
      .eq("startup_id", startupId)
    
    // Delete the startup record
    const { error: deleteError } = await supabase
      .from("startups")
      .delete()
      .eq("id", startupId)
    
    if (deleteError) {
      console.error("Error deleting startup:", deleteError)
      return NextResponse.json({ message: "Failed to delete startup", error: deleteError.message }, { status: 500 })
    }
    
    // Create an audit log entry
    await supabase.from("audit_log").insert({
      user_id: session.user.id,
      action: "delete",
      entity_type: "startup",
      entity_id: startupId,
      details: { id: startupId },
    })
    
    return NextResponse.json({
      message: "Startup deleted successfully"
    }, { status: 200 })
  } catch (error: any) {
    console.error("Error in startup deletion:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
} 