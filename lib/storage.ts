import { createServerComponentClient } from "@/lib/supabase/server-component"
import { v4 as uuidv4 } from "uuid"

export async function uploadFile(
  file: File,
  storagePath: string
): Promise<string | null> {
  if (!file) return null

  try {
    const supabase = await createServerComponentClient()
    
    // Ensure bucket exists
    const bucketName = storagePath.split('/')[0]
    const { error: bucketError } = await supabase.storage.getBucket(bucketName)
    
    if (bucketError && bucketError.message.includes("does not exist")) {
      await supabase.storage.createBucket(bucketName, {
        public: true
      })
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${storagePath}/${fileName}`
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath.replace(`${bucketName}/`, ''), file)
      
    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return null
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath.replace(`${bucketName}/`, ''))
      
    return urlData.publicUrl
  } catch (error) {
    console.error("File upload error:", error)
    return null
  }
} 