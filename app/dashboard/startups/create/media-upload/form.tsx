"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon, FileText, LinkIcon, Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { mediaUploadSchema, type MediaUploadFormValues } from "@/lib/validations/startup"
import type { StartupMediaInfo } from "@/types/startup"
import { toast } from "@/components/ui/use-toast"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { Card, CardContent } from "@/components/ui/card"
import { useMediaQuery } from "@/app/hooks/use-media-query"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface MediaUploadFormProps {
  onSubmit: (data: MediaUploadFormValues, isValid: boolean) => void
  onBack: () => void
  initialData?: Partial<StartupMediaInfo>
  isSubmitting?: boolean
  hideButtons?: boolean
}

export default function MediaUploadForm({
  onSubmit,
  onBack,
  initialData = {},
  isSubmitting = false,
  hideButtons = false,
}: MediaUploadFormProps) {
  // Use a custom hook for media queries
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Centralized upload state management
  const [uploadState, setUploadState] = useState({
    logo: {
      preview: null as string | null,
      isUploading: false,
    },
    coverImage: {
      preview: null as string | null,
      isUploading: false,
    },
    pitchDeck: {
      fileName: null as string | null,
      isUploading: false,
    },
  })

  // Add refs for file inputs to enable reset
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const pitchDeckInputRef = useRef<HTMLInputElement>(null)

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

  // Optimized file handling with improved state management
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: any, fileType: "logo" | "coverImage") => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        form.setError(field.name as any, {
          type: "manual",
          message: "File size must be less than 5MB",
        })
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        })
        return
      }

      // Validate file type for images
      if (!file.type.startsWith("image/")) {
        form.setError(field.name as any, {
          type: "manual",
          message: "Please select an image file",
        })
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      // Update upload state
      setUploadState((prev) => ({
        ...prev,
        [fileType]: {
          ...prev[fileType],
          isUploading: true,
        },
      }))

      // Use setTimeout to prevent UI freezing during file processing
      setTimeout(() => {
        field.onChange(file)

        const reader = new FileReader()

        reader.onloadend = () => {
          setUploadState((prev) => ({
            ...prev,
            [fileType]: {
              preview: reader.result as string,
              isUploading: false,
            },
          }))
        }

        reader.onerror = () => {
          setUploadState((prev) => ({
            ...prev,
            [fileType]: {
              ...prev[fileType],
              isUploading: false,
            },
          }))
          form.setError(field.name as any, {
            type: "manual",
            message: "Error reading file",
          })
        }

        reader.readAsDataURL(file)
      }, 50)
    },
    [form],
  )

  const handlePitchDeckChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > MAX_FILE_SIZE) {
        form.setError(field.name as any, {
          type: "manual",
          message: "File size must be less than 5MB",
        })
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        })
        return
      }

      // Validate file type for documents
      if (
        ![
          "application/pdf",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ].includes(file.type)
      ) {
        form.setError(field.name as any, {
          type: "manual",
          message: "Please select a PDF or PowerPoint file",
        })
        toast({
          title: "Invalid file type",
          description: "Please select a PDF or PowerPoint file",
          variant: "destructive",
        })
        return
      }

      // Update upload state
      setUploadState((prev) => ({
        ...prev,
        pitchDeck: {
          ...prev.pitchDeck,
          isUploading: true,
        },
      }))

      // Use setTimeout to prevent UI freezing
      setTimeout(() => {
        field.onChange(file)
        setUploadState((prev) => ({
          ...prev,
          pitchDeck: {
            fileName: file.name,
            isUploading: false,
          },
        }))
      }, 50)
    },
    [form],
  )

  const clearFile = useCallback(
    (field: any, fileType: "logo" | "coverImage", inputRef: React.RefObject<HTMLInputElement>) => {
      field.onChange(null)
      setUploadState((prev) => ({
        ...prev,
        [fileType]: {
          ...prev[fileType],
          preview: null,
        },
      }))
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [],
  )

  const clearPitchDeck = useCallback((field: any, inputRef: React.RefObject<HTMLInputElement>) => {
    field.onChange(null)
    setUploadState((prev) => ({
      ...prev,
      pitchDeck: {
        ...prev.pitchDeck,
        fileName: null,
      },
    }))
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [])

  const handleSubmit = (data: MediaUploadFormValues) => {
    onSubmit(data, true)
  }

  // Load initial data if available
  useEffect(() => {
    if (initialData.logo) {
      setUploadState((prev) => ({
        ...prev,
        logo: {
          ...prev.logo,
          preview: typeof initialData.logo === "string" ? initialData.logo : null,
        },
      }))
    }

    if (initialData.coverImage) {
      setUploadState((prev) => ({
        ...prev,
        coverImage: {
          ...prev.coverImage,
          preview: typeof initialData.coverImage === "string" ? initialData.coverImage : null,
        },
      }))
    }

    if (initialData.pitchDeck) {
      setUploadState((prev) => ({
        ...prev,
        pitchDeck: {
          ...prev.pitchDeck,
          fileName: typeof initialData.pitchDeck === "string" ? "Pitch Deck" : null,
        },
      }))
    }
  }, [initialData])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Media & Social Links</h2>
          <p className="text-muted-foreground">Upload your startup's media assets and add social media links.</p>
        </div>

        {/* Company Logo Section */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Company Logo</h3>
                <p className="text-sm text-muted-foreground">
                  This is your main brand identifier displayed throughout the platform.
                </p>
              </div>

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col items-center space-y-2">
                        {uploadState.logo.preview ? (
                          <div className="relative w-32 h-32">
                            <img
                              src={uploadState.logo.preview || "/placeholder.svg"}
                              alt="Logo preview"
                              className="w-full h-full object-contain rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => clearFile(field, "logo", logoInputRef)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
                              aria-label="Remove logo"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-md border-muted-foreground/25 transition-colors hover:border-muted-foreground/40">
                              {uploadState.logo.isUploading ? (
                                <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                              ) : (
                                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                              )}
                            </div>
                            <label htmlFor="logo-upload" className="cursor-pointer mt-2">
                              <div className="flex items-center gap-1 text-sm text-primary hover:underline">
                                <Upload className="h-4 w-4" />
                                <span>Upload Logo</span>
                              </div>
                              <Input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, field, "logo")}
                                disabled={uploadState.logo.isUploading}
                                ref={logoInputRef}
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
            </div>
          </CardContent>
        </Card>

        {/* Banner Image Section */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Banner Image</h3>
                <p className="text-sm text-muted-foreground">
                  This image appears at the top of your startup profile page.
                </p>
              </div>

              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col items-center space-y-2 w-full">
                        {uploadState.coverImage.preview ? (
                          <div className="relative w-full h-40 sm:h-48">
                            <img
                              src={uploadState.coverImage.preview || "/placeholder.svg"}
                              alt="Cover image preview"
                              className="w-full h-full object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => clearFile(field, "coverImage", coverInputRef)}
                              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
                              aria-label="Remove cover image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center w-full">
                            <div className="flex items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed rounded-md border-muted-foreground/25 transition-colors hover:border-muted-foreground/40">
                              {uploadState.coverImage.isUploading ? (
                                <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                              ) : (
                                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                              )}
                            </div>
                            <label htmlFor="cover-upload" className="cursor-pointer mt-2">
                              <div className="flex items-center gap-1 text-sm text-primary hover:underline">
                                <Upload className="h-4 w-4" />
                                <span>Upload Banner Image</span>
                              </div>
                              <Input
                                id="cover-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, field, "coverImage")}
                                disabled={uploadState.coverImage.isUploading}
                                ref={coverInputRef}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a banner image for your startup profile (PNG or JPG, max 5MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Media Section */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Additional Media</h3>
                <p className="text-sm text-muted-foreground">Add a pitch deck and video to showcase your startup.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="pitchDeck"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pitch Deck</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center space-y-2">
                          {uploadState.pitchDeck.fileName ? (
                            <div className="relative flex items-center p-3 w-full border rounded-md bg-muted/10">
                              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[calc(100%-3rem)]">
                                {uploadState.pitchDeck.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => clearPitchDeck(field, pitchDeckInputRef)}
                                className="ml-auto bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
                                aria-label="Remove pitch deck"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center w-full">
                              <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md border-muted-foreground/25 transition-colors hover:border-muted-foreground/40">
                                {uploadState.pitchDeck.isUploading ? (
                                  <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                                ) : (
                                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                                )}
                              </div>
                              <label htmlFor="pitch-deck-upload" className="cursor-pointer mt-2">
                                <div className="flex items-center gap-1 text-sm text-primary hover:underline">
                                  <Upload className="h-4 w-4" />
                                  <span>Upload Pitch Deck</span>
                                </div>
                                <Input
                                  id="pitch-deck-upload"
                                  type="file"
                                  accept=".pdf,.pptx,.ppt"
                                  className="hidden"
                                  onChange={(e) => handlePitchDeckChange(e, field)}
                                  disabled={uploadState.pitchDeck.isUploading}
                                  ref={pitchDeckInputRef}
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
                      <FormLabel>Demo/Pitch Video URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input placeholder="https://youtube.com/watch?v=..." className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>YouTube or Vimeo URL to your startup's demo or pitch video</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Social Links</h3>
                <p className="text-sm text-muted-foreground">Connect your social media accounts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="socialLinks.linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input placeholder="https://linkedin.com/company/..." className="pl-10" {...field} />
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
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input placeholder="https://twitter.com/..." className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!hideButtons && (
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto order-2 sm:order-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Detailed Info
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
