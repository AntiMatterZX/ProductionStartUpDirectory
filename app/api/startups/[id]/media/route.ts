import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { STORAGE_BUCKETS, getBucketForMediaType } from "@/lib/utils/config/storage-buckets"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient()
    const startupId = params.id

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // First verify the user owns this startup
    const { data: startup, error: ownershipError } = await supabase
      .from("startups")
      .select("user_id, slug")
      .eq("id", startupId)
      .single()

    if (ownershipError || !startup) {
      console.error("Error verifying startup ownership:", ownershipError);
      return NextResponse.json(
        { message: "Startup not found" },
        { status: 404 }
      )
    }

    if (startup.user_id !== session.user.id) {
      return NextResponse.json(
        { message: "You don't have permission to edit this startup" },
        { status: 403 }
      )
    }

    // Extract data from the form
    let mediaType, url, title;
    try {
      const body = await request.json();
      ({ mediaType, url, title } = body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { message: "Invalid request format" },
        { status: 400 }
      )
    }

    if (!mediaType || !url) {
      return NextResponse.json(
        { message: "Media type and URL are required" },
        { status: 400 }
      )
    }

    // Get the current media arrays
    const { data: currentMedia, error: mediaFetchError } = await supabase
      .from("startups")
      .select("media_images, media_documents, media_videos, logo_url")
      .eq("id", startupId)
      .single()

    if (mediaFetchError) {
      console.error("Error fetching current media:", mediaFetchError);
      return NextResponse.json(
        { message: "Failed to fetch current media data", error: mediaFetchError.message },
        { status: 500 }
      )
    }

    // Initialize arrays if they don't exist
    const mediaImages = currentMedia.media_images || [];
    const mediaDocuments = currentMedia.media_documents || [];
    const mediaVideos = currentMedia.media_videos || [];

    // Determine which array to update based on media type
    let updateData: Record<string, any> = {};
    
    if (mediaType === "logo") {
      // For logos, we update both the logo_url field and add to the media_images array
      updateData = {
        logo_url: url,
        media_images: [...mediaImages, url]
      };
    } else if (mediaType === "image" || mediaType === "coverImage") {
      updateData = {
        media_images: [...mediaImages, url]
      };
    } else if (mediaType === "document" || mediaType === "pitch_deck" || mediaType === "pitchDeck") {
      updateData = {
        media_documents: [...mediaDocuments, url]
      };
    } else if (mediaType === "video") {
      updateData = {
        media_videos: [...mediaVideos, url]
      };
    } else {
      return NextResponse.json(
        { message: "Invalid media type" },
        { status: 400 }
      )
    }

    // Update the media arrays in the startups table
    const { error: updateError } = await supabase
      .from("startups")
      .update(updateData)
      .eq("id", startupId)

    if (updateError) {
      console.error("Error updating startup media:", updateError);
      return NextResponse.json(
        { message: "Failed to update media", error: updateError.message },
        { status: 500 }
      )
    }

    // Create an audit log entry
    try {
      await supabase.from("audit_log").insert({
        user_id: session.user.id,
        action: "update_media",
        entity_type: "startup",
        entity_id: startupId,
        details: { mediaType, title, url },
      });
    } catch (error) {
      // Don't fail if audit log fails
      console.error("Error creating audit log:", error);
    }

    // Revalidate paths to ensure UI updates
    revalidatePath(`/dashboard/startups/${startupId}`);
    revalidatePath(`/startups`);
    if (startup.slug) {
      revalidatePath(`/startups/${startup.slug}`);
    }

    return NextResponse.json({
      message: "Media updated successfully",
      id: startupId,
    })
  } catch (error: any) {
    console.error("Error in media update:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerComponentClient()
    const startupId = params.id
    
    let mediaType, url;
    try {
      const body = await request.json();
      ({ mediaType, url } = body);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { message: "Invalid request format" },
        { status: 400 }
      )
    }

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // First verify the user owns this startup
    const { data: startup, error: ownershipError } = await supabase
      .from("startups")
      .select("user_id, slug, media_images, media_documents, media_videos, logo_url")
      .eq("id", startupId)
      .single()

    if (ownershipError || !startup) {
      return NextResponse.json(
        { message: "Startup not found" },
        { status: 404 }
      )
    }

    if (startup.user_id !== session.user.id) {
      return NextResponse.json(
        { message: "You don't have permission to edit this startup" },
        { status: 403 }
      )
    }

    // Initialize arrays
    const mediaImages = startup.media_images || [];
    const mediaDocuments = startup.media_documents || [];
    const mediaVideos = startup.media_videos || [];
    let updateData: Record<string, any> = {};

    // Remove the URL from the appropriate media array
    if (mediaType === "logo" || mediaType === "image" || mediaType === "coverImage") {
      const updatedImages = mediaImages.filter((item: string) => item !== url);
      updateData = { media_images: updatedImages };
      
      // If removing the logo, also clear the logo_url field
      if (mediaType === "logo" && startup.logo_url === url) {
        updateData = { ...updateData, logo_url: null };
      }
    } else if (mediaType === "document" || mediaType === "pitch_deck" || mediaType === "pitchDeck") {
      const updatedDocs = mediaDocuments.filter((item: string) => item !== url);
      updateData = { media_documents: updatedDocs };
    } else if (mediaType === "video") {
      const updatedVideos = mediaVideos.filter((item: string) => item !== url);
      updateData = { media_videos: updatedVideos };
    } else {
      return NextResponse.json(
        { message: "Invalid media type" },
        { status: 400 }
      )
    }

    // Update the startup record
    const { error: updateError } = await supabase
      .from("startups")
      .update(updateData)
      .eq("id", startupId)

    if (updateError) {
      console.error("Error updating startup media:", updateError);
      return NextResponse.json(
        { message: "Failed to remove media", error: updateError.message },
        { status: 500 }
      )
    }

    // Try to delete the file from storage
    try {
      // Extract bucket and path from URL
      const bucket = getBucketForMediaType(mediaType);
      const urlParts = url.split(`/public/${bucket}/`);
      
      if (urlParts.length === 2) {
        const path = urlParts[1];
        await supabase.storage.from(bucket).remove([path]);
      }
    } catch (error) {
      // Don't fail if storage deletion fails
      console.error("Error deleting file from storage:", error);
    }

    // Create an audit log entry
    try {
      await supabase.from("audit_log").insert({
        user_id: session.user.id,
        action: "delete_media",
        entity_type: "startup",
        entity_id: startupId,
        details: { mediaType, url },
      });
    } catch (error) {
      // Don't fail if audit log fails
      console.error("Error creating audit log:", error);
    }

    // Revalidate paths to ensure UI updates
    revalidatePath(`/dashboard/startups/${startupId}`);
    revalidatePath(`/startups`);
    if (startup.slug) {
      revalidatePath(`/startups/${startup.slug}`);
    }

    return NextResponse.json({
      message: "Media removed successfully",
    })
  } catch (error: any) {
    console.error("Error removing media:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    )
  }
} 