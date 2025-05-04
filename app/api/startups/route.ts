import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { startupFormSchema } from "@/lib/validations/startup"
import type { Database } from "@/types/database"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/helpers/slug-generator"
import { sendEmail, startupCreationTemplate } from "@/lib/email"

const ADMIN_EMAIL = 'varunbhole@gmail.com'; // The email address to notify

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

    // Insert the startup into the database
    try {
      console.log("API Route: Creating startup record in database");
      const { data: startupData, error: startupError } = await supabase
        .from("startups")
        .insert({
          name: basicInfo.name,
          slug: basicInfo.slug || slug,
          tagline: basicInfo.tagline || null,
          description: detailedInfo.description,
          logo_url: logoUrl,
          funding_stage: detailedInfo.fundingStage || null,
          funding_amount: detailedInfo.fundingAmount || null,
          team_size: detailedInfo.teamSize || null,
          location: detailedInfo.location || null,
          website: basicInfo.website || null,
          looking_for: detailedInfo.lookingFor || [],
          status: "pending", // All new startups start with pending status
          industry: basicInfo.industry || null,
          founding_date: basicInfo.foundingDate || null,
          user_id: session.user.id,
          media_images: mediaImages,
          media_videos: mediaVideos,
          media_documents: mediaDocuments,
        })
        .select()
        .single();
      
      if (startupError) {
        console.error("API Route: Error creating startup:", startupError);
        return NextResponse.json(
          { message: "Failed to create startup", error: startupError.message },
          { status: 500 }
        );
      }
      
      console.log("API Route: Startup created successfully:", startupData?.id);
      
      // Create social links if provided
      if (mediaInfo.socialLinks && Object.keys(mediaInfo.socialLinks).length > 0) {
        console.log("API Route: Adding social links");
        
        for (const [platform, url] of Object.entries(mediaInfo.socialLinks)) {
          if (url) {
            const { data: linkData, error: linkError } = await supabase
              .from("social_links")
              .insert({
                startup_id: startupData?.id,
                platform: platform,
                url: url,
              });
            
            if (linkError) {
              console.error(`API Route: Error adding ${platform} social link:`, linkError);
              // Continue despite error, not critical
            } else {
              console.log(`API Route: Added ${platform} social link`);
            }
          }
        }
      }
      
      // Send email notification to admin
      try {
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `New Startup Created: ${basicInfo.name}`,
          html: startupCreationTemplate(basicInfo.name, basicInfo.slug || slug)
        });
        
        console.log("API Route: Admin notification email sent successfully");
      } catch (emailError) {
        console.error("API Route: Error sending admin notification email:", emailError);
        // Continue despite email error, not critical for startup creation
      }
      
      // Revalidate paths to update any pages showing startups
      revalidatePath("/admin/moderation");
      revalidatePath("/admin/dashboard");
      revalidatePath("/startups");
      revalidatePath(`/startups/${basicInfo.slug || slug}`);
      
      return NextResponse.json({ 
        message: "Startup created successfully", 
        id: startupData?.id, 
        slug: startupData?.slug 
      });
    } catch (error) {
      console.error("API Route: Unexpected error creating startup:", error);
      return NextResponse.json(
        { 
          message: "An unexpected error occurred", 
          error: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }
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
