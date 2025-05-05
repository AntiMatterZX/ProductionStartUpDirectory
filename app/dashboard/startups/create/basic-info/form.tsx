"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { basicInfoSchema, type BasicInfoFormValues } from "@/lib/validations/startup"
import { generateSlug, checkSlugAvailability } from "@/lib/utils/helpers/slug-generator"
import type { StartupBasicInfo } from "@/types/startup"
import { ArrowRight, Globe, CheckCircle, XCircle, Loader2 } from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { cn } from "@/lib/utils"

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

  // Setup form with validation
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
    mode: "onChange",
  })

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

  // Auto-generate slug when name changes
  const watchName = form.watch("name")
  useEffect(() => {
    if (watchName) {
      const slug = generateSlug(watchName)
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
    if (!slug) return true
    
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

  // Form submission handler
  const handleSubmit = async (values: BasicInfoFormValues) => {
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

  const taglineLength = form.watch("tagline")?.length || 0
  const maxTaglineLength = 150

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Basic Information</h2>
          <p className="text-muted-foreground">Let's start with the essential details about your startup.</p>
        </div>

        {/* Startup Name & Slug Section */}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Startup Name*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your startup name" 
                    {...field} 
                    className="max-w-md" 
                  />
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
                <FormLabel>URL Slug*</FormLabel>
                <FormControl>
                  <div className="relative max-w-md">
                    <Input
                      placeholder="your-startup-name"
                      {...field}
                      onChange={(e) => {
                        // Auto-convert to valid slug format
                        const value = e.target.value
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
                      {isCheckingSlug ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : field.value ? (
                        isSlugAvailable ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )
                      ) : null}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
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
                  <FormLabel>Tagline*</FormLabel>
                  <span className={cn(
                    "text-xs",
                    taglineLength > maxTaglineLength ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {taglineLength}/{maxTaglineLength}
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="A short, catchy description of your startup"
                    {...field}
                    className="resize-none max-w-2xl"
                    maxLength={maxTaglineLength}
                  />
                </FormControl>
                <FormDescription>Keep it concise and compelling (max 150 characters)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Industry & Details Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Industry & Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry*</FormLabel>
                  {isLoading ? (
                    <div className="h-10 w-full max-w-sm bg-muted/20 animate-pulse rounded-md"></div>
                  ) : (
                    <Select
                      onValueChange={(value) => field.onChange(Number.parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="max-w-sm">
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
                  <FormLabel>Founded Date*</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      className="max-w-sm" 
                    />
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
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <div className="relative max-w-md">
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
          <div className="flex justify-end pt-4">
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
