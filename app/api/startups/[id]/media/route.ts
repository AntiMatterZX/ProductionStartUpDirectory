import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

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
      .select("user_id")
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

    // Extract data from the form
    const { mediaType, url, title } = await request.json()

    if (!mediaType || !url) {
      return NextResponse.json(
        { message: "Media type and URL are required" },
        { status: 400 }
      )
    }

    // Get the current media arrays
    const { data: currentMedia, error: mediaFetchError } = await supabase
      .from("startups")
      .select("media_images, media_documents, media_videos")
      .eq("id", startupId)
      .single()

    if (mediaFetchError) {
      return NextResponse.json(
        { message: "Failed to fetch current media data", error: mediaFetchError.message },
        { status: 500 }
      )
    }

    // Determine which array to update based on media type
    let updateData = {}
    
    if (mediaType === "image" || mediaType === "logo") {
      // For logos, we update both the logo_url field and add to the media_images array
      if (mediaType === "logo") {
        updateData = {
          logo_url: url,
          media_images: [...(currentMedia.media_images || []), url]
        }
      } else {
        updateData = {
          media_images: [...(currentMedia.media_images || []), url]
        }
      }
    } else if (mediaType === "document" || mediaType === "pitch_deck") {
      // For pitch decks, we might want to track it separately in the future
      updateData = {
        media_documents: [...(currentMedia.media_documents || []), url]
      }
    } else if (mediaType === "video") {
      updateData = {
        media_videos: [...(currentMedia.media_videos || []), url]
      }
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
      return NextResponse.json(
        { message: "Failed to update media", error: updateError.message },
        { status: 500 }
      )
    }

    // Create an audit log entry
    await supabase.from("audit_log").insert({
      user_id: session.user.id,
      action: "update_media",
      entity_type: "startup",
      entity_id: startupId,
      details: { mediaType, title },
    })

    revalidatePath(`/dashboard/startups/${startupId}`)

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
    const { mediaType, url } = await request.json()

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
      .select("user_id, media_images, media_documents, media_videos, logo_url")
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

    let updateData = {}

    // Remove the URL from the appropriate media array
    if (mediaType === "image" || mediaType === "logo") {
      const updatedImages = (startup.media_images || []).filter((item: string) => item !== url)
      updateData = { media_images: updatedImages }
      
      // If removing the logo, also clear the logo_url field
      if (mediaType === "logo" && startup.logo_url === url) {
        updateData = { ...updateData, logo_url: null }
      }
    } else if (mediaType === "document" || mediaType === "pitch_deck") {
      const updatedDocs = (startup.media_documents || []).filter((item: string) => item !== url)
      updateData = { media_documents: updatedDocs }
    } else if (mediaType === "video") {
      const updatedVideos = (startup.media_videos || []).filter((item: string) => item !== url)
      updateData = { media_videos: updatedVideos }
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
      return NextResponse.json(
        { message: "Failed to remove media", error: updateError.message },
        { status: 500 }
      )
    }

    revalidatePath(`/dashboard/startups/${startupId}`)

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