import { createClientComponentClient as createSupabaseClient } from "@supabase/auth-helpers-nextjs" 
import type { Database } from "@/types/database"

// For client-side usage (CSR)
export const createClientComponentClient = <T = Database>() => {
  return createSupabaseClient<T>()
} 