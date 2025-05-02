"use server"

import { createServerComponentClient as createServerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

// For server-side usage (SSR)
export const createServerComponentClient = async <T = Database>() => {
  // Await cookies() before using it
  const cookieStore = await cookies()
  return createServerClient<T>({
    cookies: () => cookieStore
  })
} 