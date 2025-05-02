"use server"

import { createServerComponentClient as createServerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// For server-side usage (SSR)
export const createServerComponentClient = async <T = Database>() => {
  // In Next.js 15, cookies() is no longer needed to be awaited - use directly
  return createServerClient<T>({
    cookies
  })
} 