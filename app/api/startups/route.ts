import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { startupFormSchema } from "@/lib/validations/startup"
import type { Database } from "@/types/database"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/helpers/slug-generator"

export async function POST(request: NextRequest) {
  try {
    console.log("API Route: Startup creation request received");
    
    const supabase = await createServerComponentClient()
    console.log("API Route: Supabase client initialized");

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("API Route: Unauthorized - No session found");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    console.log("API Route: User authenticated, ID:", session.user.id);

    // Extract data from the FormData
    let formData;
    try {
      formData = await request.formData();
      console.log("API Route: FormData successfully parsed");
      
      // Log FormData entries for debugging
      console.log("API Route: FormData keys:", [...formData.keys()]);
    } catch (error) {
      console.error("API Route: Error parsing form data:", error);
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
      
      console.log("API Route: FormData values retrieved");
      
      if (!basicInfoStr) {
        console.error("API Route: Missing basicInfo in form data");
        return NextResponse.json({ message: "Missing basicInfo in form data" }, { status: 400 });
      }
      
      if (!detailedInfoStr) {
        console.error("API Route: Missing detailedInfo in form data");
        return NextResponse.json({ message: "Missing detailedInfo in form data" }, { status: 400 });
      }
      
      if (!mediaInfoStr) {
        console.error("API Route: Missing mediaInfo in form data");
        return NextResponse.json({ message: "Missing mediaInfo in form data" }, { status: 400 });
      }
      
      console.log("API Route: Parsing JSON data from form fields");
      basicInfo = JSON.parse(basicInfoStr);
      detailedInfo = JSON.parse(detailedInfoStr);
      mediaInfo = JSON.parse(mediaInfoStr);
      console.log("API Route: Successfully parsed JSON data");
    } catch (error) {
      console.error("API Route: Error parsing JSON from form data:", error);
      return NextResponse.json({ 
        message: "Invalid JSON in form data",
        error: error instanceof Error ? error.message : String(error)
      }, { status: 400 });
    }
    
    // File handling
    console.log("API Route: Processing file uploads");
    
    // Get files from FormData if present
    const logo = formData.get("logo");
    const coverImage = formData.get("coverImage");
    const pitchDeck = formData.get("pitchDeck");
    
    console.log("API Route: File objects retrieved:", {
      hasLogo: !!logo,
      hasCoverImage: !!coverImage,
      hasPitchDeck: !!pitchDeck
    });
    
    // Handle file storage and get URLs
    let logoUrl = basicInfo?.logoUrl || null;
    let coverImageUrl = mediaInfo?.coverImageUrl || null;
    let pitchDeckUrl = mediaInfo?.pitchDeckUrl || null;
    const videoUrl = mediaInfo?.videoUrl || null;
    
    // Process file uploads and get URLs
    if (logo && typeof logo !== 'string') {
      try {
        console.log("API Route: Processing logo upload");
        // For debugging, log the file object properties
        console.log("API Route: Logo file properties:", {
          type: typeof logo,
          hasName: 'name' in logo,
          hasSize: 'size' in logo,
          hasType: 'type' in logo
        });
        
        const fileExt = 'name' in logo ? (logo.name as string).split('.').pop() : 'png';
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/logos/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from("public")
          .upload(filePath, logo, {
            cacheControl: "3600",
            upsert: false,
          });
        
        if (error) {
          console.error("API Route: Error uploading logo:", error);
        } else {
          const { data: urlData } = supabase.storage
            .from("public")
            .getPublicUrl(filePath);
          
          logoUrl = urlData.publicUrl;
          console.log("API Route: Logo uploaded successfully, URL:", logoUrl);
        }
      } catch (error) {
        console.error("API Route: Error processing logo upload:", error);
        // Continue without failing the whole request
      }
    }
    
    if (coverImage && typeof coverImage !== 'string') {
      try {
        console.log("API Route: Processing cover image upload");
        const fileExt = 'name' in coverImage ? (coverImage.name as string).split('.').pop() : 'png';
        const fileName = `cover-${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/images/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from("public")
          .upload(filePath, coverImage, {
            cacheControl: "3600",
            upsert: false,
          });
        
        if (error) {
          console.error("API Route: Error uploading cover image:", error);
        } else {
          const { data: urlData } = supabase.storage
            .from("public")
            .getPublicUrl(filePath);
          
          coverImageUrl = urlData.publicUrl;
          console.log("API Route: Cover image uploaded successfully, URL:", coverImageUrl);
        }
      } catch (error) {
        console.error("API Route: Error processing cover image upload:", error);
        // Continue without failing the whole request
      }
    }
    
    if (pitchDeck && typeof pitchDeck !== 'string') {
      try {
        console.log("API Route: Processing pitch deck upload");
        const fileExt = 'name' in pitchDeck ? (pitchDeck.name as string).split('.').pop() : 'pdf';
        const fileName = `pitch-deck-${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/documents/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from("public")
          .upload(filePath, pitchDeck, {
            cacheControl: "3600",
            upsert: false,
          });
        
        if (error) {
          console.error("API Route: Error uploading pitch deck:", error);
        } else {
          const { data: urlData } = supabase.storage
            .from("public")
            .getPublicUrl(filePath);
          
          pitchDeckUrl = urlData.publicUrl;
          console.log("API Route: Pitch deck uploaded successfully, URL:", pitchDeckUrl);
        }
      } catch (error) {
        console.error("API Route: Error processing pitch deck upload:", error);
        // Continue without failing the whole request
      }
    }
    
    console.log("API Route: File processing complete");
    console.log("API Route: Creating startup with data:", {
      basicInfo: { name: basicInfo.name, slug: basicInfo.slug },
      detailedInfo: { description: detailedInfo.description?.substring(0, 50) + "..." },
      mediaInfo: { hasLinks: !!mediaInfo.socialLinks },
      logoUrl,
      coverImageUrl,
      pitchDeckUrl,
      videoUrl
    });

    // Verify required fields are present
    if (!basicInfo?.name) {
      console.error("API Route: Missing startup name");
      return NextResponse.json({ message: "Startup name is required" }, { status: 400 });
    }

    if (!detailedInfo?.description) {
      console.error("API Route: Missing startup description");
      return NextResponse.json({ message: "Startup description is required" }, { status: 400 });
    }

    // Generate a slug from the name
    const slug = basicInfo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    console.log("API Route: Generated slug:", slug);

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

    // Add video to media_videos array if it exists
    if (videoUrl) {
      mediaVideos.push(videoUrl);
    }

    // Prepare looking_for array
    let lookingFor: number[] = [];
    if (Array.isArray(detailedInfo.lookingFor)) {
      lookingFor = detailedInfo.lookingFor.map((id: any) => {
        // Make sure we're working with numbers
        const parsedId = Number(id);
        return isNaN(parsedId) ? 0 : parsedId;  // Default to 0 if parsing fails
      }).filter((id: number) => id > 0);  // Filter out invalid IDs
    }
    
    console.log("API Route: Prepared looking_for array:", lookingFor);

    // Prepare the startup data for insertion
    const startupData = {
      name: basicInfo.name,
      slug,
      description: detailedInfo.description,
      website_url: basicInfo.websiteUrl || null,
      logo_url: logoUrl,
      founding_date: basicInfo.foundingDate || null,
      employee_count: detailedInfo.teamSize ? parseInt(detailedInfo.teamSize) : null,
      funding_stage: detailedInfo.fundingStage || null,
      funding_amount: detailedInfo.fundingAmount ? parseFloat(detailedInfo.fundingAmount) : null,
      location: detailedInfo.location || null,
      category_id: basicInfo.categoryId || null,
      user_id: session.user.id,
      status: "active",
      tagline: basicInfo.tagline || null,
      linkedin_url: mediaInfo.socialLinks?.linkedin || null,
      twitter_url: mediaInfo.socialLinks?.twitter || null,
      looking_for: lookingFor,
      media_images: mediaImages,
      media_documents: mediaDocuments,
      media_videos: mediaVideos
    };

    console.log("API Route: Prepared data for DB insertion");

    // Create the new startup record with consolidated fields
    console.log("API Route: Inserting startup into database");
    const { data: startup, error: createError } = await supabase
      .from("startups")
      .insert(startupData)
      .select()
      .single();

    if (createError) {
      console.error("API Route: Error creating startup:", createError);
      return NextResponse.json({ 
        message: "Failed to create startup", 
        error: createError.message, 
        details: createError 
      }, { status: 500 });
    }

    console.log("API Route: Successfully created startup with ID:", startup.id);

    // Create an audit log entry
    try {
      console.log("API Route: Creating audit log entry");
      await supabase.from("audit_log").insert({
        user_id: session.user.id,
        action: "create",
        entity_type: "startup",
        entity_id: startup.id,
        details: { name: basicInfo.name },
      });
      console.log("API Route: Audit log entry created");
    } catch (auditError) {
      // Don't fail the whole request if audit logging fails
      console.error("API Route: Error creating audit log:", auditError);
    }

    console.log("API Route: Startup creation complete, returning success response");
    return NextResponse.json({
      message: "Startup created successfully",
      id: startup.id,
    });
  } catch (error: any) {
    console.error("API Route: Unhandled error in startup creation:", error);
    // Log the full error details including stack trace
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return NextResponse.json({ 
      message: "Internal server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
