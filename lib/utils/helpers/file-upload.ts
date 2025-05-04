import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getBucketForMediaType, getStoragePath, STORAGE_BUCKETS } from "../config/storage-buckets"

/**
 * Upload a file to Supabase Storage with progress tracking
 * @param file The file to upload
 * @param userId The user ID to use in the path
 * @param mediaType The type of media (logo, image, document, etc.)
 * @param onProgress Optional callback for upload progress
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  file: File, 
  userId: string, 
  mediaType: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!file || !userId) {
    throw new Error("File and userId are required")
  }

  const supabase = createClientComponentClient()

  try {
    // Validate file type based on media type
    if (!validateFileType(file, mediaType)) {
      throw new Error(`Invalid file type for ${mediaType}. Please check supported formats.`);
    }

    // Generate a unique filename with timestamp and random string to prevent collisions
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    
    // Get the appropriate bucket and path
    const bucket = getBucketForMediaType(mediaType)
    const path = getStoragePath(userId, mediaType, fileName)
    
    // NOTE: We no longer try to create buckets dynamically
    // Buckets should be created by admins in the Supabase dashboard
    // This prevents "violates row-level security policy" errors
    
    // Track upload progress
    let progressInterval: any = null;
    if (onProgress) {
      // Start at 0% progress
      onProgress(0);
      
      // For small files, create a reasonable simulation of progress
      if (file.size < 500000) { // Less than 500KB
        let currentProgress = 0;
        progressInterval = setInterval(() => {
          const randomIncrement = Math.floor(Math.random() * 15) + 5; // 5-20% increment
          currentProgress = Math.min(90, currentProgress + randomIncrement);
          onProgress(currentProgress);
        }, 300);
      } else {
        // For larger files, use slower progress updates
        let currentProgress = 0;
        progressInterval = setInterval(() => {
          const randomIncrement = Math.floor(Math.random() * 10) + 2; // 2-12% increment
          currentProgress = Math.min(90, currentProgress + randomIncrement);
          onProgress(currentProgress);
        }, 500);
      }
    }
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true, // Allow overwriting existing files
      })

    // Clear the interval regardless of outcome
    if (progressInterval) {
      clearInterval(progressInterval)
    }

    if (error) {
      console.error("Storage upload error:", error)
      throw new Error(`Error uploading file: ${error.message}`)
    }
    
    // If we got here, set progress to 100%
    if (onProgress) {
      onProgress(100)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Failed to get public URL")
    }

    // Record metadata in startup_media_items table if it's a startup-related upload
    if (mediaType !== 'avatar' && mediaType !== 'profile') {
      try {
        // Get startup ID from path or parameter
        // This function doesn't have startup ID, so it will be handled by the API endpoint
        console.log("File uploaded successfully:", urlData.publicUrl);
      } catch (metadataError) {
        console.error("Error recording media metadata:", metadataError);
        // Don't fail the upload if metadata recording fails
      }
    }

    return urlData.publicUrl
  } catch (error: any) {
    // Ensure progress is reset on error
    if (onProgress) {
      onProgress(0)
    }
    console.error("File upload error:", error)
    throw new Error(`Error uploading file: ${error.message}`)
  }
}

/**
 * Validates file type based on media type
 * @param file File to validate
 * @param mediaType Type of media (logo, image, document, etc.)
 * @returns boolean indicating if file type is valid
 */
export function validateFileType(file: File, mediaType: string): boolean {
  const mimeType = file.type.toLowerCase();
  
  switch(mediaType.toLowerCase()) {
    case 'logo':
    case 'image':
    case 'coverimage':
      // Only allow common image formats
      return /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/.test(mimeType);
      
    case 'document':
    case 'pitch_deck':
    case 'pitchdeck':
      // Allow documents and presentations
      return /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)$/.test(mimeType);
      
    case 'video':
      // Allow common video formats
      return /^video\/(mp4|webm|ogg|quicktime)$/.test(mimeType);
      
    default:
      // Default to true for unknown types
      return true;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param mediaType The type of media to determine the bucket
 * @param path The path to the file within the bucket
 * @returns True if deletion was successful
 */
export async function deleteFile(mediaType: string, path: string): Promise<boolean> {
  if (!path) {
    throw new Error("Path is required")
  }

  const supabase = createClientComponentClient()
  const bucket = getBucketForMediaType(mediaType)

  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Storage delete error:", error)
      throw new Error(`Error deleting file: ${error.message}`)
    }

    return true
  } catch (error: any) {
    console.error("File deletion error:", error)
    throw new Error(`Error deleting file: ${error.message}`)
  }
}

/**
 * Extract the path portion from a Supabase Storage URL
 * @param url The full public URL
 * @param bucket The bucket name
 * @returns The path within the bucket
 */
export function getPathFromUrl(url: string, bucket: string): string {
  try {
    // Handle different URL formats from Supabase
    // Typical format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    // or: https://xxx.supabase.co/storage/v1/object/authenticated/bucket-name/path/to/file
    
    // First try the /public/ path format
    let parts = url.split(`/public/${bucket}/`)
    
    if (parts.length === 2) {
      return parts[1]
    }
    
    // Try the /authenticated/ path format
    parts = url.split(`/authenticated/${bucket}/`)
    if (parts.length === 2) {
      return parts[1]
    }
    
    // Try a more general approach if the above fails
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === bucket)
    
    if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/')
    }
    
    throw new Error("Could not parse URL format")
  } catch (error) {
    console.error("Error extracting path from URL:", error)
    return url // Return original URL if we can't parse it
  }
}
