import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { STORAGE_BUCKETS, getBucketForMediaType } from "@/lib/utils/config/storage-buckets"
import { deleteFile, getPathFromUrl } from "@/lib/utils/helpers/file-upload"

// Helper to normalize media types
function normalizeMediaType(mediaType: string): string {
  // Normalize camelCase to snake_case and handle common variations
  switch (mediaType.toLowerCase()) {
    case "logo":
      return "logo";
    case "coverimage":
    case "cover_image":
    case "cover":
      return "image";
    case "pitchdeck":
    case "pitch_deck":
      return "document";
    default:
      return mediaType.toLowerCase();
  }
}

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
    let mediaType, url, title, description;
    try {
      const body = await request.json();
      ({ mediaType, url, title, description } = body);
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

    // Normalize the media type
    const normalizedMediaType = normalizeMediaType(mediaType);

    // Get the current media arrays
    const { data: currentMedia, error: mediaFetchError } = await supabase
      .from("startups")
      .select("media_images, media_documents, media_videos, logo_url, logo_media_url, pitch_deck_url")
      .eq("id", startupId)
      .single()

    if (mediaFetchError) {
      console.error("Error fetching current media:", mediaFetchError);
      return NextResponse.json(
        { message: "Failed to fetch current media data", error: mediaFetchError.message },
        { status: 500 }
      )
    }

    // Initialize arrays with default empty arrays even if currentMedia is null
    const mediaImages = currentMedia?.media_images && Array.isArray(currentMedia.media_images) 
      ? [...currentMedia.media_images] 
      : [];
      
    const mediaDocuments = currentMedia?.media_documents && Array.isArray(currentMedia.media_documents) 
      ? [...currentMedia.media_documents] 
      : [];
      
    const mediaVideos = currentMedia?.media_videos && Array.isArray(currentMedia.media_videos) 
      ? [...currentMedia.media_videos] 
      : [];

    // If we don't have current media data, we'll create it now rather than failing
    if (!currentMedia) {
      console.warn("No media data found for startup, creating new media arrays:", startupId);
    }

    // Determine which array to update based on media type
    let updateData: Record<string, any> = {};
    
    if (normalizedMediaType === "logo") {
      // For logos, we update the logo_url field and add to the media_images array if it's not already there
      updateData = {
        logo_url: url,
        logo_media_url: url
      };
      
      // Only add to media_images if not already there
      if (!mediaImages.includes(url)) {
        updateData.media_images = [...mediaImages, url];
      }
    } else if (normalizedMediaType === "image") {
      // Only add to media_images if not already there
      if (!mediaImages.includes(url)) {
        updateData.media_images = [...mediaImages, url];
      } else {
        updateData.media_images = mediaImages; // Keep the same array
      }
    } else if (normalizedMediaType === "document") {
      // Only add to media_documents if not already there
      if (!mediaDocuments.includes(url)) {
        updateData.media_documents = [...mediaDocuments, url];
      } else {
        updateData.media_documents = mediaDocuments; // Keep the same array
      }
      
      // If this is the first document or explicitly marked as pitch deck, set as pitch_deck_url
      if (mediaDocuments.length === 0 || mediaType.toLowerCase().includes("pitch")) {
        updateData.pitch_deck_url = url;
      }
    } else if (normalizedMediaType === "video") {
      // Only add to media_videos if not already there
      if (!mediaVideos.includes(url)) {
        updateData.media_videos = [...mediaVideos, url];
      } else {
        updateData.media_videos = mediaVideos; // Keep the same array
      }
    } else {
      return NextResponse.json(
        { message: `Invalid media type: ${mediaType}` },
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
        details: { mediaType: normalizedMediaType, title, url },
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
      url: url,
      mediaType: normalizedMediaType
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

    if (!mediaType || !url) {
      return NextResponse.json(
        { message: "Media type and URL are required" },
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
      .select("user_id, slug, media_images, media_documents, media_videos, logo_url, logo_media_url, pitch_deck_url")
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

    // Normalize the media type
    const normalizedMediaType = normalizeMediaType(mediaType);
    
    // Initialize arrays and ensure they're arrays
    const mediaImages = Array.isArray(startup.media_images) ? [...startup.media_images] : [];
    const mediaDocuments = Array.isArray(startup.media_documents) ? [...startup.media_documents] : [];
    const mediaVideos = Array.isArray(startup.media_videos) ? [...startup.media_videos] : [];
    
    let updateData: Record<string, any> = {};

    // Try to delete from storage
    try {
      const bucket = getBucketForMediaType(normalizedMediaType);
      const path = getPathFromUrl(url, bucket);
      
      // Attempt to delete the file from storage
      await deleteFile(normalizedMediaType, path);
    } catch (error) {
      console.error("Error deleting file from storage:", error);
      // Continue with database update even if storage delete fails
    }

    // Update the appropriate arrays or fields
    if (normalizedMediaType === "logo" || normalizedMediaType === "image") {
      updateData.media_images = mediaImages.filter(item => item !== url);
      
      // If this was the logo, clear the logo field
      if (startup.logo_url === url || startup.logo_media_url === url) {
        updateData.logo_url = null;
        updateData.logo_media_url = null;
      }
    } else if (normalizedMediaType === "document") {
      updateData.media_documents = mediaDocuments.filter(item => item !== url);
      
      // If this was the pitch deck, clear the pitch deck field
      if (startup.pitch_deck_url === url) {
        updateData.pitch_deck_url = null;
      }
    } else if (normalizedMediaType === "video") {
      updateData.media_videos = mediaVideos.filter(item => item !== url);
    }

    // Update the database
    const { error: updateError } = await supabase
      .from("startups")
      .update(updateData)
      .eq("id", startupId)

    if (updateError) {
      console.error("Error updating startup after media deletion:", updateError);
      return NextResponse.json(
        { message: "Failed to update media records", error: updateError.message },
        { status: 500 }
      )
    }

    // Create an audit log entry
    try {
      await supabase.from("audit_log").insert({
        user_id: session.user.id,
        action: "delete_media",
        entity_type: "startup",
        entity_id: startupId,
        details: { mediaType: normalizedMediaType, url },
      });
    } catch (error) {
      // Don't fail if audit log fails
      console.error("Error creating audit log:", error);
    }

    // Revalidate paths
    revalidatePath(`/dashboard/startups/${startupId}`);
    revalidatePath(`/startups`);
    if (startup.slug) {
      revalidatePath(`/startups/${startup.slug}`);
    }

    return NextResponse.json({
      message: "Media deleted successfully",
      id: startupId,
    })
  } catch (error: any) {
    console.error("Error in media deletion:", error)
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    )
  }
} 