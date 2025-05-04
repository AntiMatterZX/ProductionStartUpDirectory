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
import { ArrowLeft, ArrowRight } from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"

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
  hideButtons = false
}: DetailedInfoFormProps) {
  const [lookingForOptions, setLookingForOptions] = useState<{ id: number; name: string }[]>([])
  const supabase = createClientComponentClient()

  // Fetch looking for options on component mount
  useEffect(() => {
    async function fetchLookingForOptions() {
      const { data, error } = await supabase.from("looking_for_options").select("id, name").order("name")

      if (error) {
        console.error("Error fetching looking for options:", error)
        return
      }

      setLookingForOptions(data || [])
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
    onSubmit(data, true);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Startup Description*</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide a detailed description of your startup, including your mission, vision, and what problem you're solving."
                    {...field}
                    className="min-h-[180px] resize-none"
                  />
                </FormControl>
                <FormDescription>Minimum 50 characters, maximum 2000 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="fundingStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Funding Stage*</FormLabel>
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
                  <FormLabel className="text-base">Funding Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 500000 (for $500K)" {...field} />
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

          <FormField
            control={form.control}
            name="lookingFor"
            render={() => (
              <FormItem className="mt-2">
                <div className="mb-4">
                  <FormLabel className="text-base">Looking For*</FormLabel>
                  <FormDescription>Select what your startup is currently seeking</FormDescription>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-md p-4 bg-muted/10">
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
                            <FormLabel className="font-normal">{option.name}</FormLabel>
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
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Basic Info
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoadingIndicator size="sm" /> : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
