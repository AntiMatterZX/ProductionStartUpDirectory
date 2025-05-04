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
    // Extract file extension and create unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const fileName = `${type.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `${userId}/${type}/${fileName}`;

    // For debugging
    console.log(`Uploading file to ${filePath}`, {
      fileType: file.type,
      fileSize: file.size,
      fileName: file.name
    });
    
    // Upload to "public" bucket in Supabase Storage
    const { data, error } = await supabase.storage
      .from("startups")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
    
    if (error) {
      console.error(`Error uploading ${type}:`, error.message);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("startups")
      .getPublicUrl(filePath);
    
    console.log(`File uploaded successfully. Public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadFile for ${type}:`, error);
    return null;
  }
}

// Add a helper function to parse team size ranges
function parseTeamSize(teamSize: string | number | null): number | null {
  if (teamSize === null || teamSize === undefined) return null;
  
  // If it's already a number, just return it
  if (typeof teamSize === 'number') return teamSize;
  
  // Try to parse it directly as an integer first
  const directParse = parseInt(teamSize);
  if (!isNaN(directParse)) return directParse;
  
  // Handle ranges like "2-5" or "5-10" by taking the average
  if (teamSize.includes('-')) {
    const parts = teamSize.split('-');
    const min = parseInt(parts[0]);
    const max = parseInt(parts[1]);
    
    if (!isNaN(min) && !isNaN(max)) {
      // Return the average rounded down
      return Math.floor((min + max) / 2);
    }
  }
  
  // Extract numbers from strings like "2-5 employees"
  const matches = teamSize.match(/\d+/g);
  if (matches && matches.length > 0) {
    return parseInt(matches[0]);
  }
  
  return null;
}

// Add a helper function to parse currency/funding values
function parseFundingAmount(amount: string | number | null): number | null {
  if (amount === null || amount === undefined) return null;
  
  // If it's already a number, just return it
  if (typeof amount === 'number') return amount;
  
  // Remove currency symbols, commas, and other non-numeric characters
  const cleanedAmount = amount.toString().replace(/[$,€£¥\s]/g, '');
  
  // Try to parse it as a float
  const parsedAmount = parseFloat(cleanedAmount);
  
  return isNaN(parsedAmount) ? null : parsedAmount;
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
    
    // Make sure the "startups" bucket exists
    const { error: bucketError } = await supabase.storage.getBucket("startups");
    if (bucketError && bucketError.message.includes("does not exist")) {
      const { error: createBucketError } = await supabase.storage.createBucket("startups", {
        public: true
      });
      if (createBucketError) {
        console.error("Error creating bucket:", createBucketError);
        return NextResponse.json({ message: "Failed to create storage bucket", error: createBucketError.message }, { status: 500 });
      }
    }
    
    // Process file uploads and get URLs using our helper function
    const logoUrl = logo && typeof logo !== 'string' 
      ? await uploadFile(supabase, logo, session.user.id, 'logos') 
      : basicInfo?.logoUrl || null;
      
    let coverImageUrl = null;
    if (coverImage && typeof coverImage !== 'string') {
      console.log("Uploading cover image...");
      
      try {
        coverImageUrl = await uploadFile(supabase, coverImage, session.user.id, 'images');
        
        console.log("Cover image uploaded successfully:", coverImageUrl);
        
        // Add to media_images array if it's not already there
        if (!mediaInfo.media_images.includes(coverImageUrl)) {
          mediaInfo.media_images.push(coverImageUrl);
        }
      } catch (error) {
        console.error("Error uploading cover image:", error);
        throw new Error("Failed to upload cover image");
      }
    }
      
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
      // Note: The pitch deck is stored in the media_documents array instead of a separate column
    }

    // Add video URL to media_videos array if it exists
    if (videoUrl) {
      mediaVideos.push(videoUrl);
    }

    // Also add any additional video URLs from mediaInfo if they exist
    if (mediaInfo.videoUrl && !mediaVideos.includes(mediaInfo.videoUrl)) {
      mediaVideos.push(mediaInfo.videoUrl);
    }

    try {
      // Debug logging for values that might cause type conversion errors
      console.log("Processing startup data with the following values:");
      console.log(`- Team Size (raw): ${JSON.stringify(detailedInfo.teamSize)}`);
      console.log(`- Team Size (processed): ${parseTeamSize(detailedInfo.teamSize)}`);
      console.log(`- Funding Amount (raw): ${JSON.stringify(detailedInfo.fundingAmount)}`);
      console.log(`- Funding Amount (processed): ${parseFundingAmount(detailedInfo.fundingAmount)}`);
      console.log(`- Category ID: ${basicInfo.industry}`);
      
      // Create the startup entry
      const { data: startup, error: insertError } = await supabase
        .from("startups")
        .insert({
          name: basicInfo.name.trim(),
          slug: slug,
          tagline: basicInfo.tagline?.trim() || null,
          description: detailedInfo.description?.trim() || null,
          website_url: basicInfo.website?.trim() || null,
          logo_url: logoUrl,
          banner_url: coverImageUrl,
          pitch_deck_url: pitchDeckUrl,
          founding_date: basicInfo.foundingDate || null,
          employee_count: detailedInfo.teamSize ? parseInt(detailedInfo.teamSize) : null,
          funding_stage: detailedInfo.fundingStage || null,
          funding_amount: detailedInfo.fundingAmount ? parseFloat(detailedInfo.fundingAmount) : null,
          location: detailedInfo.location?.trim() || null,
          category_id: basicInfo.industry || null,
          user_id: session.user.id,
          status: "active",
          media_images: mediaImages,
          media_documents: mediaDocuments,
          media_videos: [],
          looking_for: detailedInfo.lookingFor || [],
          video_url: mediaInfo.videoUrl?.trim() || null,
        })
        .select("id, slug")
        .single();

      if (insertError) {
        console.error("Error creating startup:", insertError);
        return NextResponse.json({ message: "Failed to create startup in database", error: insertError.message }, { status: 500 });
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
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        message: "Database error while creating startup", 
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in POST /api/startups:", error);
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
