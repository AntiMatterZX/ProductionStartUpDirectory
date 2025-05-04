import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@/lib/supabase/server-component";
import { cookies } from "next/headers";

/**
 * @swagger
 * /api/startups/media:
 *   delete:
 *     summary: Delete a media item from a startup
 *     description: Removes a specific media item (logo, banner, image, document, or video) from a startup
 *     tags:
 *       - startups
 *     parameters:
 *       - name: startupId
 *         in: query
 *         required: true
 *         description: ID of the startup
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: mediaType
 *         in: query
 *         required: true
 *         description: Type of media to delete
 *         schema:
 *           type: string
 *           enum: [logo, banner, image, gallery, document, pitch_deck, video]
 *       - name: mediaUrl
 *         in: query
 *         required: true
 *         description: URL of the media to delete
 *         schema:
 *           type: string
 *           format: uri
 *       - name: isAdmin
 *         in: query
 *         required: false
 *         description: Flag indicating if the request is coming from an admin user
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Media deleted successfully
 *       400:
 *         description: Missing required parameters or invalid media type
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user doesn't have permission to modify this startup
 *       404:
 *         description: Startup not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - BearerAuth: []
 */
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
    const isAdmin = url.searchParams.get("isAdmin") === "true";

    if (!startupId || !mediaType || !mediaUrl) {
      return NextResponse.json({ 
        message: "Missing required parameters" 
      }, { status: 400 });
    }

    // Check if media type is valid
    const validMediaTypes = ["logo", "banner", "image", "gallery", "document", "pitch_deck", "video"];
    if (!validMediaTypes.includes(mediaType)) {
      return NextResponse.json({ 
        message: `Invalid media type. Must be one of: ${validMediaTypes.join(", ")}` 
      }, { status: 400 });
    }

    // First, check if the user owns this startup or is an admin
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

    // Check if user has permission (either owner or admin)
    const isOwner = startup.user_id === session.user.id;
    
    // Check if user is an admin if they're claiming to be
    let userIsActuallyAdmin = false;
    
    if (isAdmin) {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      userIsActuallyAdmin = userRoles?.role === 'admin' || userRoles?.role === 'superadmin';
    }

    // Return error if user doesn't have permission
    if (!isOwner && !userIsActuallyAdmin) {
      return NextResponse.json({ 
        message: "You don't have permission to modify this startup" 
      }, { status: 403 });
    }

    // Handle different media types
    try {
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
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({
        message: "Error updating database",
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
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
    } catch (storageError) {
      // Log but don't fail if storage deletion fails
      console.error("Failed to delete file from storage:", storageError);
    }

    // Log the deletion action, especially for admin actions
    if (userIsActuallyAdmin) {
      try {
        await supabase.from("admin_logs").insert({
          user_id: session.user.id,
          action: "delete_media",
          resource_type: "startup",
          resource_id: startupId,
          details: {
            mediaType,
            mediaUrl,
            isAdminAction: true
          }
        });
      } catch (logError) {
        console.error("Failed to log admin action:", logError);
      }
    }

    return NextResponse.json({ 
      message: "Media deleted successfully",
      deletedBy: userIsActuallyAdmin ? "admin" : "owner"
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json({ 
      message: "Error deleting media",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 