import { createClientComponentClient } from "@/lib/supabase/client"

export async function uploadFile(file: File, bucket: string, path: string) {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    throw new Error(`Error uploading file: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)

  return urlData.publicUrl
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = createClientComponentClient()

  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }

  return true
}
