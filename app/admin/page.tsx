import { redirect } from "next/navigation"
import { getAuthUserWithRole } from "@/lib/auth/auth"

export default async function AdminRedirectPage() {
  // Get authenticated user with role check
  await getAuthUserWithRole("/admin/dashboard", "admin")
  
  // Redirect to the admin dashboard page
  return redirect("/admin/dashboard")
} 