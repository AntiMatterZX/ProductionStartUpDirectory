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
    // Generate a unique filename with timestamp and random string to prevent collisions
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    
    // Get the appropriate bucket and path
    const bucket = getBucketForMediaType(mediaType)
    const path = getStoragePath(userId, mediaType, fileName)
    
    // Check if the bucket exists and create it if it doesn't
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError)
      throw new Error(`Error checking storage buckets: ${bucketsError.message}`)
    }
    
    const bucketExists = buckets.some(b => b.name === bucket)
    
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
        public: true
      })
      
      if (createBucketError) {
        console.error("Error creating bucket:", createBucketError)
        throw new Error(`Error creating storage bucket: ${createBucketError.message}`)
      }
    }
    
    // Simulate progress updates if callback is provided
    let progressInterval: any = null
    if (onProgress) {
      progressInterval = setInterval(() => {
        const progress = Math.floor(Math.random() * 20) + 10 // 10-30% increment per update
        onProgress(Math.min(90, progress)) // Never reach 100% until complete
      }, 500)
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
