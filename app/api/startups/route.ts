import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { startupFormSchema } from "@/lib/validations/startup"
import type { Database } from "@/types/database"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/helpers/slug-generator"
import { sendEmail, startupCreationTemplate } from "@/lib/email"

const ADMIN_EMAIL = 'varunbhole@gmail.com'; // The email address to notify

// Helper function to reduce code duplication in file uploads
async function uploadFile(supabase: any, file: File, userId: string, type: 'logos' | 'images' | 'documents') {
  if (!file) return null;
  
  try {
    const fileExt = 'name' in file ? (file.name as string).split('.').pop() : 'unknown';
    const fileName = `${type.slice(0, -1)}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${type}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from("public")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    
    if (error) {
      console.error(`Error uploading ${type}: ${error.message}`);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from("public")
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadFile for ${type}:`, error);
    return null;
  }
}

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

    // Extract data from the FormData
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json({ 
        message: "Invalid form data in request",
        error: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
    }

    // Parse JSON strings from FormData
    let basicInfo, detailedInfo, mediaInfo;
    try {
      const basicInfoStr = formData.get("basicInfo") as string;
      const detailedInfoStr = formData.get("detailedInfo") as string;
      const mediaInfoStr = formData.get("mediaInfo") as string;
      
      if (!basicInfoStr) {
        return NextResponse.json({ message: "Missing basicInfo in form data" }, { status: 400 });
      }
      
      if (!detailedInfoStr) {
        return NextResponse.json({ message: "Missing detailedInfo in form data" }, { status: 400 });
      }
      
      if (!mediaInfoStr) {
        return NextResponse.json({ message: "Missing mediaInfo in form data" }, { status: 400 });
      }
      
      basicInfo = JSON.parse(basicInfoStr);
      detailedInfo = JSON.parse(detailedInfoStr);
      mediaInfo = JSON.parse(mediaInfoStr);
    } catch (error) {
      return NextResponse.json({ 
        message: "Invalid JSON in form data",
        error: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
    }
    
    // Get files from FormData if present
    const logo = formData.get("logo");
    const coverImage = formData.get("coverImage");
    const pitchDeck = formData.get("pitchDeck");
    
    // Process file uploads and get URLs using our helper function
    const logoUrl = logo && typeof logo !== 'string' 
      ? await uploadFile(supabase, logo, session.user.id, 'logos') 
      : basicInfo?.logoUrl || null;
      
    const coverImageUrl = coverImage && typeof coverImage !== 'string'
      ? await uploadFile(supabase, coverImage, session.user.id, 'images')
      : mediaInfo?.coverImageUrl || null;
      
    const pitchDeckUrl = pitchDeck && typeof pitchDeck !== 'string'
      ? await uploadFile(supabase, pitchDeck, session.user.id, 'documents')
      : mediaInfo?.pitchDeckUrl || null;
      
    const videoUrl = mediaInfo?.videoUrl || null;

    // Verify required fields are present
    if (!basicInfo?.name) {
      return NextResponse.json({ message: "Startup name is required" }, { status: 400 });
    }

    if (!detailedInfo?.description) {
      return NextResponse.json({ message: "Startup description is required" }, { status: 400 });
    }

    // Generate a slug from the name or use the provided one
    let slug = basicInfo.slug;
    if (!slug) {
      slug = basicInfo.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Prepare media arrays
    const mediaImages: string[] = [];
    const mediaDocuments: string[] = [];
    const mediaVideos: string[] = [];

    // Add cover image to media_images array if it exists
    if (coverImageUrl) {
      mediaImages.push(coverImageUrl);
    }

    // Add logo to media_images array if it exists
    if (logoUrl) {
      mediaImages.push(logoUrl);
    }

    // Add pitch deck to media_documents array if it exists
    if (pitchDeckUrl) {
      mediaDocuments.push(pitchDeckUrl);
    }

    // Add video URL to media_videos array if it exists
    if (videoUrl) {
      mediaVideos.push(videoUrl);
    }

    // Create the startup entry
    const { data: startup, error: createError } = await supabase
      .from("startups")
      .insert({
        name: basicInfo.name,
        slug,
        description: detailedInfo.description,
        tagline: basicInfo.tagline || null,
        logo_url: logoUrl,
        cover_image_url: coverImageUrl,
        industry_id: basicInfo.industry,
        founding_date: basicInfo.foundingDate,
        website: basicInfo.website || null,
        status: "pending",
        funding_stage: detailedInfo.fundingStage,
        funding_amount: detailedInfo.fundingAmount || null,
        team_size: detailedInfo.teamSize,
        location: detailedInfo.location,
        linkedin_url: mediaInfo.socialLinks?.linkedin || null,
        twitter_url: mediaInfo.socialLinks?.twitter || null,
        pitch_deck_url: pitchDeckUrl,
        video_url: videoUrl,
        user_id: session.user.id,
        media_images: mediaImages,
        media_documents: mediaDocuments,
        media_videos: mediaVideos,
        looking_for: detailedInfo.lookingFor || [],
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating startup:", createError);
      return NextResponse.json({ message: "Failed to create startup in database", error: createError.message }, { status: 500 });
    }

    // Send email notification about the new startup to admin
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Startup Pending: ${basicInfo.name}`,
        html: startupCreationTemplate({
          startupName: basicInfo.name,
          startupId: startup.id,
          userId: session.user.id,
          userName: session.user.email || 'Unknown',
          createdAt: new Date().toISOString()
        })
      });
    } catch (emailError) {
      // Log but don't fail the request if email sending fails
      console.error("Error sending email notification:", emailError);
    }

    // Revalidate the startups page
    revalidatePath('/startups');
    revalidatePath('/admin/moderation');
    revalidatePath(`/startups/${slug}`);

    return NextResponse.json({ 
      message: "Startup created successfully", 
      id: startup.id, 
      slug: startup.slug 
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/startups:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
