import type { Metadata } from "next"
import UpdatePasswordForm from "@/components/auth/update-password-form"

export const metadata: Metadata = {
  title: "Update Password | VentureX",
  description: "Update your VentureX account password",
}

export default function UpdatePasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Update your password</h1>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>

      <UpdatePasswordForm />
    </div>
  )
}
