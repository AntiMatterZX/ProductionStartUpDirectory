import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"
import { startupFormSchema } from "@/lib/validations/startup"
import type { Database } from "@/types/database"
import { revalidatePath } from "next/cache"
import { generateUniqueSlug } from "@/lib/utils/helpers/slug-generator"
import { sendEmail, startupCreationTemplate } from "@/lib/email"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/lib/storage"
import { z } from "zod"

const ADMIN_EMAIL = 'varunbhole@gmail.com'; // The email address to notify

// Helper function to reduce code duplication in file uploads
async function uploadFile(supabase: any, file: File, userId: string, type: 'logos' | 'images' | 'documents') {
  if (!file) {
    console.error("No file provided to uploadFile");
    throw new Error("No file provided");
  }
  
  try {
    // Validate file before uploading
    if (!(file instanceof File)) {
      console.error("Invalid file object:", file);
      throw new Error("Invalid file object");
    }
    
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
    
    // Upload to "startups" bucket in Supabase Storage
    const { data, error } = await supabase.storage
      .from("startups")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });
    
    if (error) {
      console.error(`Error uploading ${type}:`, error.message);
      throw new Error(`Error uploading ${type}: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("startups")
      .getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error("Failed to get public URL for uploaded file");
      throw new Error("Failed to get public URL for uploaded file");
    }
    
    console.log(`File uploaded successfully. Public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadFile for ${type}:`, error);
    throw error; // Rethrow to be handled by the caller
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
    // Verify authentication
    const user = await auth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()

    // Parse JSON data
    const basicInfo = JSON.parse(formData.get("basicInfo") as string)
    const detailedInfo = JSON.parse(formData.get("detailedInfo") as string)
    const mediaInfoJson = formData.get("mediaInfo") as string
    const mediaInfo = mediaInfoJson ? JSON.parse(mediaInfoJson) : {}

    // Create Supabase client
    const supabase = createServerComponentClient()

    // Upload media files
    let logoImage = null
    let bannerImage = null
    let galleryImages = []
    let pitchDeckUrl = null
    
    // Upload logo if provided
    const logoFile = formData.get("logo") as File
    if (logoFile && logoFile instanceof File) {
      const logoResult = await uploadFile(logoFile, "startups/logos")
      if (logoResult) {
        logoImage = logoResult
      }
    }
    
    // Upload banner if provided
    const bannerFile = formData.get("banner") as File
    if (bannerFile && bannerFile instanceof File) {
      const bannerResult = await uploadFile(bannerFile, "startups/banners")
      if (bannerResult) {
        bannerImage = bannerResult
      }
    }

    // Upload gallery images if provided
    const galleryFiles = formData.getAll("gallery") as File[]
    if (galleryFiles.length > 0) {
      const uploadPromises = galleryFiles.map(file => {
        if (file instanceof File) {
          return uploadFile(file, "startups/gallery")
        }
        return null
      })
      
      const results = await Promise.all(uploadPromises)
      galleryImages = results.filter(Boolean)
    }
    
    // Upload pitch deck if provided
    const pitchDeckFile = formData.get("pitchDeck") as File
    if (pitchDeckFile && pitchDeckFile instanceof File) {
      const pitchDeckResult = await uploadFile(pitchDeckFile, "startups/documents")
      if (pitchDeckResult) {
        pitchDeckUrl = pitchDeckResult
      }
    }

    // Insert startup into database
    const { data: startupData, error: startupError } = await supabase
      .from("startups")
      .insert({
        name: basicInfo.name,
        slug: basicInfo.slug,
        tagline: basicInfo.tagline,
        industry_id: basicInfo.industry,
        founding_date: basicInfo.foundingDate,
        website: basicInfo.website,
        description: detailedInfo.description,
        funding_stage: detailedInfo.fundingStage,
        funding_amount: detailedInfo.fundingAmount,
        team_size: detailedInfo.teamSize,
        location: detailedInfo.location,
        video_url: mediaInfo.videoUrl,
        logo_image: logoImage,
        banner_image: bannerImage,
        gallery_images: galleryImages,
        pitch_deck_url: pitchDeckUrl,
        linkedin_url: mediaInfo.socialLinks?.linkedin,
        twitter_url: mediaInfo.socialLinks?.twitter,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (startupError) {
      console.error("Database error creating startup:", startupError)
      return NextResponse.json(
        { error: `Database error: ${startupError.message}` },
        { status: 500 }
      )
    }

    // Insert looking_for relationships if provided
    if (detailedInfo.lookingFor && detailedInfo.lookingFor.length > 0) {
      const lookingForData = detailedInfo.lookingFor.map(optionId => ({
        startup_id: startupData.id,
        option_id: optionId
      }))
      
      const { error: lookingForError } = await supabase
        .from("startup_looking_for")
        .insert(lookingForData)
      
      if (lookingForError) {
        console.error("Database error creating looking_for relationships:", lookingForError)
        // Not returning an error here since the startup was created successfully
      }
    }

    // Revalidate paths
    revalidatePath("/dashboard/startups")
    revalidatePath(`/startups/${basicInfo.slug}`)

    return NextResponse.json({ 
      id: startupData.id,
      slug: basicInfo.slug,
      message: "Startup created successfully" 
    })
  } catch (error) {
    console.error("Error creating startup:", error)
    return NextResponse.json(
      { error: "There was a problem creating your startup" },
      { status: 500 }
    )
  }
}
