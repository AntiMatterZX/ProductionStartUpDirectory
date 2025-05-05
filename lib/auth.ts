import { createServerComponentClient } from "@/lib/supabase/server-component"
import { cookies } from "next/headers"

export async function auth() {
  const supabase = await createServerComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session || !session.user) {
    return null
  }
  
  return session.user
} 