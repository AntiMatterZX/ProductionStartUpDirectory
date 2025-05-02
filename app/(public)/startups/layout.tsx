import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Startups | VentureX",
  description: "Discover innovative startups looking for investment, mentorship, and partnerships.",
}

export default function StartupsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
