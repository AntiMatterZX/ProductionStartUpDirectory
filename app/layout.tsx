import type React from "react"
import "./globals.css"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "./theme-provider"
import { LoadingProvider } from "@/components/ui/loading-context"

// Font configuration
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata = {
  title: "LaunchPad",
  description: "Connect startups with investors and resources",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased min-h-screen flex`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LoadingProvider>
            <div className="flex flex-col flex-grow">{children}</div>
            <Toaster />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
