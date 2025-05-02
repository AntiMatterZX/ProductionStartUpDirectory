import type { Metadata } from "next"
import Link from "next/link"
import SignupForm from "@/components/auth/signup-form"
import { use } from "react"

export const metadata: Metadata = {
  title: "Sign Up | VentureX",
  description: "Create an account on VentureX",
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  // Unwrap searchParams with React.use() for Next.js 15
  const unwrappedParams = use(searchParams);
  const redirectUrl = unwrappedParams.redirect;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">Enter your details to create a new account</p>
      </div>

      <SignupForm redirectUrl={redirectUrl} />

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link
          href={`/login${redirectUrl ? `?redirect=${redirectUrl}` : ""}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}
