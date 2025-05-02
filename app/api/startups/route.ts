import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { startupFormSchema } from "@/lib/validations/startup"
import type { Database } from "@/types/database"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/helpers/slug-generator"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const basicInfoStr = formData.get("basicInfo") as string
    const detailedInfoStr = formData.get("detailedInfo") as string
    const mediaInfoStr = formData.get("mediaInfo") as string

    // Parse JSON strings
    const basicInfo = JSON.parse(basicInfoStr)
    const detailedInfo = JSON.parse(detailedInfoStr)
    const mediaInfo = JSON.parse(mediaInfoStr)

    // Ensure slug is valid and unique
    const slug = await generateUniqueSlug(basicInfo.name, supabase)
    basicInfo.slug = slug

    // Validate the request data
    const validationResult = startupFormSchema.safeParse(basicInfo)

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validationResult.error.format() },
        { status: 400 },
      )
    }

    // Upload files to Supabase Storage if they exist
    let logoUrl = null
    let coverImageUrl = null
    let pitchDeckUrl = null

    if (mediaInfo.logo) {
      const logoFile = mediaInfo.logo as unknown as File
      const logoExt = logoFile.name.split(".").pop()
      const logoPath = `${session.user.id}/${Date.now()}-logo.${logoExt}`

      const { data: logoData, error: logoError } = await supabase.storage
        .from("startup-media")
        .upload(logoPath, logoFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (logoError) {
        console.error("Error uploading logo:", logoError)
      } else {
        const { data: logoUrlData } = supabase.storage.from("startup-media").getPublicUrl(logoPath)
        logoUrl = logoUrlData.publicUrl
      }
    }

    if (mediaInfo.coverImage) {
      const coverFile = mediaInfo.coverImage as unknown as File
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
      }
    }

    if (mediaInfo.pitchDeck) {
      const deckFile = mediaInfo.pitchDeck as unknown as File
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
      }
    }

    // Insert startup record
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .insert({
        name: basicInfo.name,
        slug: basicInfo.slug,
        description: detailedInfo.description,
        website_url: basicInfo.website,
        logo_url: logoUrl,
        founding_date: basicInfo.foundingDate,
        employee_count: Number.parseInt(detailedInfo.teamSize.split("-")[0]) || 1,
        funding_stage: detailedInfo.fundingStage,
        funding_amount: detailedInfo.fundingAmount ? Number.parseFloat(detailedInfo.fundingAmount) : null,
        location: detailedInfo.location,
        category_id: basicInfo.industry,
        user_id: session.user.id,
        status: "pending",
      })
      .select("id")
      .single()

    if (startupError) {
      console.error("Error creating startup:", startupError)
      return NextResponse.json({ message: "Failed to create startup", error: startupError.message }, { status: 500 })
    }

    // Insert looking_for options
    if (detailedInfo.lookingFor.length > 0) {
      const lookingForData = detailedInfo.lookingFor.map((optionId: number) => ({
        startup_id: startup.id,
        option_id: optionId,
      }))

      const { error: lookingForError } = await supabase.from("startup_looking_for").insert(lookingForData)

      if (lookingForError) {
        console.error("Error inserting looking_for options:", lookingForError)
      }
    }

    // Insert social links
    if (mediaInfo.socialLinks) {
      const socialLinksData = Object.entries(mediaInfo.socialLinks)
        .filter(([_, url]) => url)
        .map(([platform, url]) => ({
          startup_id: startup.id,
          platform,
          url,
        }))

      if (socialLinksData.length > 0) {
        const { error: socialLinksError } = await supabase.from("social_links").insert(socialLinksData)

        if (socialLinksError) {
          console.error("Error inserting social links:", socialLinksError)
        }
      }
    }

    // Insert additional media (cover image and pitch deck)
    const mediaEntries = []

    if (coverImageUrl) {
      mediaEntries.push({
        startup_id: startup.id,
        media_type: "image",
        url: coverImageUrl,
        title: "Cover Image",
        is_featured: true,
      })
    }

    if (pitchDeckUrl) {
      mediaEntries.push({
        startup_id: startup.id,
        media_type: "document",
        url: pitchDeckUrl,
        title: "Pitch Deck",
        is_featured: false,
      })
    }

    if (mediaInfo.videoUrl) {
      mediaEntries.push({
        startup_id: startup.id,
        media_type: "video",
        url: mediaInfo.videoUrl,
        title: "Demo Video",
        is_featured: false,
      })
    }

    if (mediaEntries.length > 0) {
      const { error: mediaError } = await supabase.from("startup_media").insert(mediaEntries)

      if (mediaError) {
        console.error("Error inserting media entries:", mediaError)
      }
    }

    // Create an audit log entry
    await supabase.from("audit_log").insert({
      user_id: session.user.id,
      action: "create",
      entity_type: "startup",
      entity_id: startup.id,
      details: { name: basicInfo.name },
    })

    return NextResponse.json({
      message: "Startup created successfully",
      id: startup.id,
    })
  } catch (error: any) {
    console.error("Error in startup creation:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
