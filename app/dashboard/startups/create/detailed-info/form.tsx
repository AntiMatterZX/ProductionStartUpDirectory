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
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import LoadingIndicator from "@/components/ui/loading-indicator"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaQuery } from "@/app/hooks/use-media-query"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const supabase = createClientComponentClient()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Fetch looking for options on component mount with better error handling
  useEffect(() => {
    async function fetchLookingForOptions() {
      setIsLoadingOptions(true)
      try {
        const { data, error } = await supabase.from("looking_for_options").select("id, name").order("name")

        if (error) {
          console.error("Error fetching looking for options:", error)
          return
        }

        setLookingForOptions(data || [])
      } catch (error) {
        console.error("Failed to fetch looking for options:", error)
      } finally {
        setIsLoadingOptions(false)
      }
    }

    fetchLookingForOptions()
  }, [supabase])

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

  const handleSubmit = (data: DetailedInfoFormValues) => {
    onSubmit(data, true)
  }

  // Calculate character count for description
  const descriptionLength = form.watch("description")?.length || 0
  const maxDescriptionLength = 2000

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Startup Details</h2>
          <p className="text-muted-foreground">
            Tell us more about your startup to help investors and partners understand your business.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">Startup Description*</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {descriptionLength}/{maxDescriptionLength}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed description of your startup, including your mission, vision, and what problem you're solving."
                      {...field}
                      className="min-h-[180px] resize-none"
                      maxLength={maxDescriptionLength}
                    />
                  </FormControl>
                  <FormDescription>Minimum 50 characters, maximum 2000 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-medium mb-4">Funding & Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fundingStage"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base">Funding Stage*</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Select the current funding stage of your startup</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base">Funding Amount (Optional)</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Enter the total amount of funding raised in USD</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-muted-foreground">$</span>
                        </div>
                        <Input placeholder="e.g., 500000 (for $500K)" className="pl-7" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>Total funding raised so far in USD</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Team Size*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel className="text-base">Primary Location*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                    <FormDescription>Where your startup is headquartered</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <FormField
              control={form.control}
              name="lookingFor"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base">Looking For*</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Select all the resources your startup is currently seeking</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormDescription>Select what your startup is currently seeking</FormDescription>
                  </div>

                  {isLoadingOptions ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-md p-4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-32 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-md p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                      {lookingForOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="lookingFor"
                          render={({ field }) => {
                            return (
                              <FormItem key={option.id} className="flex flex-row items-start space-x-3 space-y-0">
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
                                <FormLabel className="font-normal cursor-pointer">{option.name}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage className="mt-2" />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {!hideButtons && (
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
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
