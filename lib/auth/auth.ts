"use server"

import { redirect } from "next/navigation"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import type { Database } from "@/types/database"

/**
 * Get the authenticated user with secure verification
 * Uses the recommended pattern from Supabase for secure authentication
 */
export async function getAuthUser(redirectTo?: string) {
  const supabase = await createServerComponentClient<Database>()
  
  // First get the session (cookie-based)
  const { data: { session } } = await supabase.auth.getSession()
  
  // If no session, redirect if requested
  if (!session) {
    if (redirectTo) {
      redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
    }
    return { user: null, supabase }
  }
  
  // For security, verify the user with the auth server
  const { data: { user } } = await supabase.auth.getUser()
  
  // If session exists but user verification failed, sign out
  if (!user) {
    await supabase.auth.signOut()
    if (redirectTo) {
      redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)
    }
    return { user: null, supabase }
  }
  
  return { user, supabase }
}

/**
 * Get the authenticated user with role information
 */
export async function getAuthUserWithRole(redirectTo?: string, requiredRole?: string) {
  const { user, supabase } = await getAuthUser(redirectTo)
  
  if (!user) {
    return { user: null, profile: null, role: null, supabase }
  }
  
  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .single()
    
  const role = profile?.roles?.name
  
  // Check if user has required role
  if (requiredRole && role !== requiredRole) {
    redirect("/dashboard")
  }
  
  return { user, profile, role, supabase }
} 