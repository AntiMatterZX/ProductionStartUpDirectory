"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SlugChecker from "@/components/startup/creation/SlugChecker"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { basicInfoSchema, type BasicInfoFormValues } from "@/lib/validations/startup"
import { generateSlug, checkSlugAvailability } from "@/lib/utils/helpers/slug-generator"
import type { StartupBasicInfo } from "@/types/startup"
import { ArrowRight, Globe } from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"

interface BasicInfoFormProps {
  onSubmit: (data: BasicInfoFormValues, isValid: boolean) => void
  initialData?: Partial<StartupBasicInfo>
  isSubmitting?: boolean
  hideButtons?: boolean
}

export default function BasicInfoForm({
  onSubmit,
  initialData = {},
  isSubmitting = false,
  hideButtons = false,
}: BasicInfoFormProps) {
  const [isSlugAvailable, setIsSlugAvailable] = useState(true)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("categories").select("id, name").order("name")

        if (error) {
          console.error("Error fetching categories:", error)
          return
        }

        setCategories(data || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: initialData.name || "",
      slug: initialData.slug || "",
      tagline: initialData.tagline || "",
      industry: initialData.industry || 0,
      foundingDate: initialData.foundingDate || new Date().toISOString().split("T")[0],
      website: initialData.website || "",
    },
    mode: "onChange", // Enable validation on change
  })

  // Auto-generate slug when name changes
  const watchName = form.watch("name")
  useEffect(() => {
    if (watchName) {
      const slug = generateSlug(watchName)

      // Only update slug if it's empty or was auto-generated (matches the previous name)
      const currentSlug = form.getValues("slug")
      const previousNameSlug = generateSlug(watchName.slice(0, -1))

      if (!currentSlug || currentSlug === previousNameSlug) {
        form.setValue("slug", slug)
        checkSlug(slug)
      }
    }
  }, [watchName, form])

  // Check slug availability with debounce
  const checkSlug = async (slug: string) => {
    if (!slug) return

    setIsCheckingSlug(true)
    try {
      const available = await checkSlugAvailability(slug, supabase)
      setIsSlugAvailable(available)
      return available
    } catch (error) {
      console.error("Error checking slug:", error)
      return false
    } finally {
      setIsCheckingSlug(false)
    }
  }

  const handleSubmit = async (values: BasicInfoFormValues) => {
    // Final validation of the slug before submission
    const slugValid = await checkSlug(values.slug)

    if (!slugValid) {
      form.setError("slug", {
        type: "manual",
        message: "This slug is already taken. Please choose another one.",
      })
      onSubmit(values, false)
      return
    }

    onSubmit(values, true)
  }

  // Calculate character count for tagline
  const taglineLength = form.watch("tagline")?.length || 0
  const maxTaglineLength = 150

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 w-full max-w-4xl mx-auto pb-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <p className="text-muted-foreground">Let's start with the essential details about your startup.</p>
        </div>

        <div className="space-y-6 p-6 bg-muted/10 rounded-lg border">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Startup Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your startup name" {...field} className="w-full" />
                </FormControl>
                <FormDescription>The official name of your startup</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">URL Slug*</FormLabel>
                <FormControl>
                  <div className="relative w-full">
                    <Input
                      placeholder="your-startup-name"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        // Auto convert to valid slug format
                        const sanitizedSlug = generateSlug(value)

                        if (sanitizedSlug !== value) {
                          e.target.value = sanitizedSlug
                          field.onChange(sanitizedSlug)
                        } else {
                          field.onChange(e)
                        }

                        if (sanitizedSlug) {
                          const timer = setTimeout(() => {
                            checkSlug(sanitizedSlug)
                          }, 500)
                          return () => clearTimeout(timer)
                        }
                      }}
                      className="pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <SlugChecker slug={field.value} isAvailable={isSlugAvailable} isChecking={isCheckingSlug} />
                    </div>
                  </div>
                </FormControl>
                <FormDescription className="text-sm">
                  This will be used in your profile URL: venture-connect.com/startups/{field.value || "your-slug"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Tagline*</FormLabel>
                  <span className="text-xs text-muted-foreground">
                    {taglineLength}/{maxTaglineLength}
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="A short, catchy description of your startup"
                    {...field}
                    className="resize-none min-h-[80px]"
                    maxLength={maxTaglineLength}
                  />
                </FormControl>
                <FormDescription>Keep it concise and compelling (max 150 characters)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-6 p-6 bg-muted/10 rounded-lg border">
          <h3 className="text-lg font-medium">Industry & Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Industry*</FormLabel>
                  {isLoading ? (
                    <div className="h-10 w-full bg-muted/20 animate-pulse rounded-md"></div>
                  ) : (
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormDescription>The primary industry your startup operates in</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="foundingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Founded Date*</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>The date your startup was founded</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Website</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input placeholder="https://yourstartup.com" className="pl-10" {...field} />
                  </div>
                </FormControl>
                <FormDescription>Your startup's official website (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!hideButtons && (
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? <LoadingIndicator size="sm" /> : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
