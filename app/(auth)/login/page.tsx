import type { Metadata } from "next"
import Link from "next/link"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login | VentureX",
  description: "Login to your VentureX account",
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const redirectUrl = searchParams.redirect;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      <LoginForm redirectUrl={redirectUrl} />

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${redirectUrl ? `?redirect=${redirectUrl}` : ""}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}
