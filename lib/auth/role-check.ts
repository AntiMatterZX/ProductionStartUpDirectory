import { createServerComponentClient } from "@/lib/supabase/client"

export async function getUserRole(userId: string) {
  const supabase = createServerComponentClient()

  const { data, error } = await supabase.from("profiles").select("role_id, roles(name)").eq("id", userId).single()

  if (error || !data) {
    return { role: "user", roleId: null }
  }

  return {
    role: data.roles?.name || "user",
    roleId: data.role_id,
  }
}

export function hasRequiredRole(userRole: string, requiredRoles: string[]) {
  return requiredRoles.includes(userRole)
}
