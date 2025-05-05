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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary/80 to-primary">Basic Information</h2>
          <p className="text-muted-foreground text-lg">Let's start with the essential details about your startup.</p>
        </div>

        {/* Startup Name & Slug Section */}
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Startup Name*</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your startup name" 
                    {...field} 
                    className="max-w-xl text-base" 
                  />
                </FormControl>
                <FormDescription className="text-sm">The official name of your startup</FormDescription>
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
                  <div className="relative max-w-xl">
                    <Input
                      placeholder="your-startup-name"
                      {...field}
                      onChange={(e) => {
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
                      className="pr-10 text-base"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isCheckingSlug ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : field.value ? (
                        isSlugAvailable ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )
                      ) : null}
                    </div>
                  </div>
                </FormControl>
                <FormDescription className="text-sm flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  venture-connect.com/startups/{field.value || "your-slug"}
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
                <FormLabel className="text-base">Tagline*</FormLabel>
                <FormControl>
                  <div className="relative max-w-xl">
                    <Textarea 
                      placeholder="A brief, catchy description of your startup" 
                      {...field}
                      className="resize-none text-base min-h-[80px]"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                      {taglineLength}/{maxTaglineLength}
                    </div>
                  </div>
                </FormControl>
                <FormDescription className="text-sm">
                  A concise description that captures your startup's essence
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem className="w-full max-w-xl">
                <FormLabel className="text-base">Industry*</FormLabel>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="w-full text-base">
                      <SelectValue placeholder="Select your industry">
                        {isLoading ? (
                          <LoadingIndicator size="sm" />
                        ) : (
                          categories.find(cat => cat.id === field.value)?.name || "Select your industry"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent 
                    position="popper" 
                    className="w-full max-h-[300px] overflow-y-auto"
                    align="start"
                    sideOffset={4}
                    collisionPadding={20}
                  >
                    {categories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id.toString()}
                        className="text-base"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-sm">
                  Choose the industry that best describes your startup
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="foundingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Founding Date*</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    className="max-w-xl text-base" 
                  />
                </FormControl>
                <FormDescription className="text-sm">
                  When did you start your startup?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Website</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://your-startup.com" 
                    {...field} 
                    className="max-w-xl text-base" 
                  />
                </FormControl>
                <FormDescription className="text-sm">
                  Your startup's website (if available)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!hideButtons && (
          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting || !form.formState.isValid}
              size="lg"
              className="gap-2 text-base font-semibold"
            >
              Continue
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
