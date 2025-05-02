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

interface BasicInfoFormProps {
  onSubmit: (data: BasicInfoFormValues, isValid: boolean) => void
  initialData?: Partial<StartupBasicInfo>
}

export default function BasicInfoForm({ onSubmit, initialData = {} }: BasicInfoFormProps) {
  const [isSlugAvailable, setIsSlugAvailable] = useState(true)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const supabase = createClientComponentClient()

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from("categories").select("id, name").order("name")

      if (error) {
        console.error("Error fetching categories:", error)
        return
      }

      setCategories(data || [])
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
    mode: "onChange" // Enable validation on change
  })

  // Auto-generate slug when name changes
  const watchName = form.watch("name")
  useEffect(() => {
    if (watchName) {
      const slug = generateSlug(watchName)
      
      // Only update slug if it's empty or was auto-generated (matches the previous name)
      const currentSlug = form.getValues("slug");
      const previousNameSlug = generateSlug(watchName.slice(0, -1));
      
      if (!currentSlug || currentSlug === previousNameSlug) {
        form.setValue("slug", slug);
        checkSlug(slug);
      }
    }
  }, [watchName, form]);

  // Check slug availability
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
        message: "This slug is already taken. Please choose another one." 
      })
      onSubmit(values, false)
      return
    }
    
    onSubmit(values, true)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString())

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-6">
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
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="your-startup-name"
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Auto convert to valid slug format
                        const sanitizedSlug = generateSlug(value);
                        
                        if (sanitizedSlug !== value) {
                          e.target.value = sanitizedSlug;
                          field.onChange(sanitizedSlug);
                        } else {
                          field.onChange(e);
                        }
                        
                        if (sanitizedSlug) {
                          checkSlug(sanitizedSlug);
                        }
                      }}
                      className="flex-grow"
                    />
                    <SlugChecker slug={field.value} isAvailable={isSlugAvailable} isChecking={isCheckingSlug} />
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
                <FormLabel className="text-base">Tagline*</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A short, catchy description of your startup"
                    {...field}
                    className="resize-none min-h-[80px]"
                  />
                </FormControl>
                <FormDescription>Keep it concise and compelling (max 150 characters)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Industry*</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number.parseInt(value))}
                    defaultValue={field.value.toString()}
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
                  <Input placeholder="https://yourstartup.com" {...field} />
                </FormControl>
                <FormDescription>Your startup's official website (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="min-w-[120px]">Continue to Detailed Info</Button>
        </div>
      </form>
    </Form>
  )
}
