"use client"

import type React from "react"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon, FileText, LinkIcon, Loader2 } from "lucide-react"
import { mediaUploadSchema, type MediaUploadFormValues } from "@/lib/validations/startup"
import type { StartupMediaInfo } from "@/types/startup"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface MediaUploadFormProps {
  onSubmit: (data: MediaUploadFormValues) => void
  onBack: () => void
  initialData?: Partial<StartupMediaInfo>
  isSubmitting?: boolean
}

export default function MediaUploadForm({ onSubmit, onBack, initialData = {}, isSubmitting }: MediaUploadFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [pitchDeckName, setPitchDeckName] = useState<string | null>(null)

  const form = useForm<MediaUploadFormValues>({
    resolver: zodResolver(mediaUploadSchema),
    defaultValues: {
      logo: null,
      coverImage: null,
      pitchDeck: null,
      videoUrl: initialData.videoUrl || "",
      socialLinks: {
        linkedin: initialData.socialLinks?.linkedin || "",
        twitter: initialData.socialLinks?.twitter || "",
      },
    },
  })

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
    setPreview: (preview: string | null) => void,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError(field.name as any, {
          type: "manual",
          message: "File size must be less than 5MB",
        })
        return
      }

      field.onChange(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePitchDeckChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError(field.name as any, {
          type: "manual",
          message: "File size must be less than 5MB",
        })
        return
      }

      field.onChange(file)
      setPitchDeckName(file.name)
    }
  }

  const clearFile = (field: any, setPreview: (preview: string | null) => void) => {
    field.onChange(null)
    setPreview(null)
  }

  const clearPitchDeck = (field: any) => {
    field.onChange(null)
    setPitchDeckName(null)
  }

  // In a real implementation, we would upload files to Supabase Storage
  // This is a simplified version that just passes the files to the parent component
  const handleSubmit = (data: MediaUploadFormValues) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-2">
                    {logoPreview ? (
                      <div className="relative w-32 h-32">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo preview"
                          className="w-full h-full object-contain rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => clearFile(field, setLogoPreview)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-md border-muted-foreground/25">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <label htmlFor="logo-upload" className="cursor-pointer mt-2">
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <Upload className="h-4 w-4" />
                            <span>Upload Logo</span>
                          </div>
                          <Input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, field, setLogoPreview)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>Upload your startup logo (PNG or JPG, max 5MB)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-2">
                    {coverPreview ? (
                      <div className="relative w-full h-48">
                        <img
                          src={coverPreview || "/placeholder.svg"}
                          alt="Cover image preview"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => clearFile(field, setCoverPreview)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-md border-muted-foreground/25">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <label htmlFor="cover-upload" className="cursor-pointer mt-2">
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <Upload className="h-4 w-4" />
                            <span>Upload Cover Image</span>
                          </div>
                          <Input
                            id="cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, field, setCoverPreview)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>Upload a cover image for your startup profile (PNG or JPG, max 5MB)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pitchDeck"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pitch Deck</FormLabel>
                <FormControl>
                  <div className="flex flex-col items-center space-y-2">
                    {pitchDeckName ? (
                      <div className="relative flex items-center p-3 w-full border rounded-md">
                        <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-sm truncate">{pitchDeckName}</span>
                        <button
                          type="button"
                          onClick={() => clearPitchDeck(field)}
                          className="ml-auto bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md border-muted-foreground/25">
                          <FileText className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <label htmlFor="pitch-deck-upload" className="cursor-pointer mt-2">
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <Upload className="h-4 w-4" />
                            <span>Upload Pitch Deck</span>
                          </div>
                          <Input
                            id="pitch-deck-upload"
                            type="file"
                            accept=".pdf,.pptx,.ppt"
                            className="hidden"
                            onChange={(e) => handlePitchDeckChange(e, field)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>Upload your pitch deck (PDF or PowerPoint, max 5MB)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Demo Video URL</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input placeholder="https://youtube.com/watch?v=..." {...field} className="rounded-l-none" />
                  </div>
                </FormControl>
                <FormDescription>Link to a YouTube or Vimeo video showcasing your product</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="socialLinks.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input placeholder="https://linkedin.com/company/..." {...field} className="rounded-l-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialLinks.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input placeholder="https://twitter.com/..." {...field} className="rounded-l-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Startup"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
