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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 max-w-3xl mx-auto">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary/80 to-primary">Startup Details</h2>
          <p className="text-muted-foreground text-lg">
            Tell us more about your startup to help investors and partners understand your business.
          </p>
        </div>

        {/* Description Section */}
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Startup Description*</FormLabel>
                  <span className={cn(
                    "text-sm font-medium",
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
                    className="min-h-[200px] resize-none text-base"
                    maxLength={maxDescriptionLength}
                  />
                </FormControl>
                <FormDescription className="text-sm">
                  Write a compelling description (minimum {minDescriptionLength} characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fundingStage"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel className="text-base">Funding Stage*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select funding stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={4}>
                      {fundingStages.map((stage) => (
                        <SelectItem key={stage} value={stage} className="text-base">
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-sm">Your startup's current funding stage</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fundingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Funding Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Input 
                        placeholder="e.g., 500000 (for $500K)" 
                        className="pl-10 text-base" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-sm">Total funding raised so far in USD (optional)</FormDescription>
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
                <FormItem className="relative">
                  <FormLabel className="text-base">Team Size*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" sideOffset={4}>
                      {teamSizes.map((size) => (
                        <SelectItem key={size} value={size} className="text-base">
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-sm">Current number of team members</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Location*</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Input 
                        placeholder="City, Country" 
                        className="pl-10 text-base" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-sm">Primary location of your startup</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="lookingFor"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">What are you looking for?*</FormLabel>
                  <FormDescription className="text-sm">
                    Select all that apply to your startup's current needs
                  </FormDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lookingForOptions.map((option) => (
                    <FormField
                      key={option.id}
                      control={form.control}
                      name="lookingFor"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={option.id}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, option.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== option.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">
                                {option.name}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!hideButtons && (
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="gap-2 text-base"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Basics
            </Button>
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
