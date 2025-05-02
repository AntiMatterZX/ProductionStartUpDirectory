"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import OAuthButtons from "./oauth-buttons"
import type { Database } from "@/types/database"

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  role: z.string({ required_error: "Please select a role" }),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupForm({ redirectUrl }: { redirectUrl?: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "",
    },
  })

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectUrl || "/dashboard"}`,
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (authData.user) {
        // Get role ID based on role name
        const { data: roleData, error: roleError } = await supabase
          .from("roles")
          .select("id")
          .eq("name", data.role)
          .single()

        if (roleError) {
          console.error("Error fetching role:", roleError)
        }

        if (roleData) {
          // Create the profile record if it doesn't exist yet
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", authData.user.id)
            .single()

          if (!existingProfile) {
            // Insert a new profile
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: authData.user.id,
                full_name: data.fullName,
                role_id: roleData.id,
              })

            if (insertError) {
              console.error("Error creating profile:", insertError)
            }
          } else {
            // Update existing profile
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                full_name: data.fullName,
                role_id: roleData.id,
              })
              .eq("id", authData.user.id)

            if (updateError) {
              console.error("Error updating profile:", updateError)
            }
          }
        }

        toast({
          title: "Account created",
          description: "Your account has been created successfully. Please check your email to confirm your account.",
        })

        // Only redirect if the email confirmation is not required
        if (authData.session) {
          router.push(redirectUrl || "/dashboard")
          router.refresh()
        }
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "An error occurred during signup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <OAuthButtons redirectUrl={redirectUrl} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>I am a...</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="founder">Startup Founder</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="user">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
