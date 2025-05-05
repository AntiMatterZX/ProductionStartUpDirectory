"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { detailedInfoSchema, type DetailedInfoFormValues } from "@/lib/validations/startup"
import type { StartupDetailedInfo } from "@/types/startup"
import { ArrowLeft, ArrowRight, DollarSign, Building, MapPin } from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { cn } from "@/lib/utils"

interface DetailedInfoFormProps {
  onSubmit: (data: DetailedInfoFormValues, isValid: boolean) => void
  onBack: () => void
  initialData?: Partial<StartupDetailedInfo>
  isSubmitting?: boolean
  hideButtons?: boolean
}

export default function DetailedInfoForm({
  onSubmit,
  onBack,
  initialData = {},
  isSubmitting = false,
  hideButtons = false,
}: DetailedInfoFormProps) {
  const [lookingForOptions, setLookingForOptions] = useState<{ id: number; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Fetch looking for options on component mount
  useEffect(() => {
    async function fetchLookingForOptions() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("looking_for_options")
          .select("id, name")
          .order("name")

        if (error) {
          console.error("Error fetching looking for options:", error)
          return
        }

        setLookingForOptions(data || [])
      } catch (error) {
        console.error("Error fetching options:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLookingForOptions()
  }, [supabase])

  // Setup form with validation
  const form = useForm<DetailedInfoFormValues>({
    resolver: zodResolver(detailedInfoSchema),
    defaultValues: {
      description: initialData.description || "",
      fundingStage: initialData.fundingStage || "",
      fundingAmount: initialData.fundingAmount || "",
      teamSize: initialData.teamSize || "",
      location: initialData.location || "",
      lookingFor: initialData.lookingFor || [],
    },
  })

  // Define funding stages and team sizes
  const fundingStages = [
    "Pre-seed",
    "Seed",
    "Series A",
    "Series B",
    "Series C+",
    "Bootstrapped",
    "Revenue Generating",
    "Profitable",
  ]

  const teamSizes = ["Solo Founder", "2-5", "6-10", "11-25", "26-50", "51-100", "100+"]

  // Form submission handler
  const handleSubmit = (data: DetailedInfoFormValues) => {
    onSubmit(data, true)
  }

  // Character count for description
  const descriptionLength = form.watch("description")?.length || 0
  const maxDescriptionLength = 2000
  const minDescriptionLength = 50

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Startup Details</h2>
          <p className="text-muted-foreground">
            Tell us more about your startup to help investors and partners understand your business.
          </p>
        </div>

        {/* Description Section */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Startup Description*</FormLabel>
                  <span className={cn(
                    "text-xs",
                    descriptionLength < minDescriptionLength || descriptionLength > maxDescriptionLength 
                      ? "text-destructive" 
                      : "text-muted-foreground"
                  )}>
                    {descriptionLength}/{maxDescriptionLength}
                  </span>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Provide a detailed description of your startup, including your mission, vision, and what problem you're solving."
                    {...field}
                    className="min-h-[160px] resize-none"
                    maxLength={maxDescriptionLength}
                  />
                </FormControl>
                <FormDescription>Minimum 50 characters, maximum 2000 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Funding & Team Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Funding & Team</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fundingStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Stage*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="max-w-sm">
                        <SelectValue placeholder="Select funding stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fundingStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Your startup's current funding stage</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fundingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Amount (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative max-w-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input placeholder="e.g., 500000 (for $500K)" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>Total funding raised so far in USD</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="teamSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Size*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="max-w-sm">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Number of people in your team</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Location*</FormLabel>
                  <FormControl>
                    <div className="relative max-w-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input placeholder="e.g., San Francisco, CA" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>Where your startup is headquartered</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Looking For Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Looking For*</h3>
            <FormDescription>Select what your startup is currently seeking</FormDescription>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <LoadingIndicator />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lookingForOptions.map((option) => (
                <FormField
                  key={option.id}
                  control={form.control}
                  name="lookingFor"
                  render={({ field }) => (
                    <FormItem key={option.id} className="flex items-start space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, option.id])
                              : field.onChange(field.value?.filter((value) => value !== option.id))
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer text-sm">
                        {option.name}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          )}
          {form.formState.errors.lookingFor && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.lookingFor.message}
            </p>
          )}
        </div>

        {!hideButtons && (
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto order-2 sm:order-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Basic Info
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto order-1 sm:order-2">
              {isSubmitting ? <LoadingIndicator size="sm" /> : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
