import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server-component";
import { cookies } from "next/headers";

// Function to handle media deletion requests
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    
    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse URL to get query parameters
    const url = new URL(request.url);
    const startupId = url.searchParams.get("startupId");
    const mediaType = url.searchParams.get("mediaType");
    const mediaUrl = url.searchParams.get("mediaUrl");

    if (!startupId || !mediaType || !mediaUrl) {
      return NextResponse.json({ 
        message: "Missing required parameters" 
      }, { status: 400 });
    }

    // First, check if the user owns this startup
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("user_id")
      .eq("id", startupId)
      .single();

    if (startupError || !startup) {
      return NextResponse.json({ 
        message: "Startup not found" 
      }, { status: 404 });
    }

    if (startup.user_id !== session.user.id) {
      return NextResponse.json({ 
        message: "You don't have permission to modify this startup" 
      }, { status: 403 });
    }

    // Handle different media types
    switch (mediaType) {
      case "logo":
        // Set logo_url to null
        await supabase
          .from("startups")
          .update({ logo_url: null })
          .eq("id", startupId);
        break;
        
      case "banner":
        // Set banner_url to null
        await supabase
          .from("startups")
          .update({ banner_url: null })
          .eq("id", startupId);
        break;
        
      case "pitch_deck":
        // Set pitch_deck_url to null
        await supabase
          .from("startups")
          .update({ pitch_deck_url: null })
          .eq("id", startupId);
        break;
        
      case "image":
      case "gallery":
        // Remove the URL from the media_images array
        const { data: imagesData } = await supabase
          .from("startups")
          .select("media_images")
          .eq("id", startupId)
          .single();
          
        if (imagesData && imagesData.media_images) {
          const updatedImages = imagesData.media_images.filter(
            (url: string) => url !== mediaUrl
          );
          
          await supabase
            .from("startups")
            .update({ media_images: updatedImages })
            .eq("id", startupId);
        }
        break;
        
      case "document":
        // Remove the URL from the media_documents array
        const { data: documentsData } = await supabase
          .from("startups")
          .select("media_documents")
          .eq("id", startupId)
          .single();
          
        if (documentsData && documentsData.media_documents) {
          const updatedDocuments = documentsData.media_documents.filter(
            (url: string) => url !== mediaUrl
          );
          
          await supabase
            .from("startups")
            .update({ media_documents: updatedDocuments })
            .eq("id", startupId);
        }
        break;
        
      case "video":
        // Remove the URL from the media_videos array
        const { data: videosData } = await supabase
          .from("startups")
          .select("media_videos")
          .eq("id", startupId)
          .single();
          
        if (videosData && videosData.media_videos) {
          const updatedVideos = videosData.media_videos.filter(
            (url: string) => url !== mediaUrl
          );
          
          await supabase
            .from("startups")
            .update({ media_videos: updatedVideos })
            .eq("id", startupId);
        }
        break;
        
      default:
        return NextResponse.json({ 
          message: "Invalid media type" 
        }, { status: 400 });
    }

    // Optional: Delete the actual file from storage
    // This would require extracting the path from the URL
    // We would need to parse the full URL to get the storage path
    try {
      const urlObj = new URL(mediaUrl);
      const pathParts = urlObj.pathname.split('/');
      const bucketName = pathParts[1]; // Usually 'startups'
      const storagePath = pathParts.slice(2).join('/');
      
      if (bucketName && storagePath) {
        // Attempt to delete the file from storage
        await supabase.storage.from(bucketName).remove([storagePath]);
      }
    } catch (error) {
      // Log but don't fail if storage deletion fails
      console.error("Failed to delete file from storage:", error);
    }

    return NextResponse.json({ 
      message: "Media deleted successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json({ 
      message: "Error deleting media",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 