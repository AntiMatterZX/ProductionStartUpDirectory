"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon, FileText, LinkIcon, Loader2, ArrowLeft, ArrowRight, PlusCircle } from "lucide-react"
import { mediaUploadSchema, type MediaUploadFormValues } from "@/lib/validations/startup"
import type { StartupMediaInfo } from "@/types/startup"
import { toast } from "@/components/ui/use-toast"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { ScrollArea } from "@/components/ui/scroll-area"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_GALLERY_IMAGES = 5 // Maximum number of gallery images

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [pitchDeckName, setPitchDeckName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Add refs for file inputs to enable reset
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const pitchDeckInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<MediaUploadFormValues>({
    resolver: zodResolver(mediaUploadSchema),
    defaultValues: {
      logo: null,
      banner: null,
      gallery: [],
      pitchDeck: null,
      videoUrl: initialData.videoUrl || "",
      socialLinks: {
        linkedin: initialData.socialLinks?.linkedin || "",
        twitter: initialData.socialLinks?.twitter || "",
      },
    },
  })

  // Optimized file handling to prevent performance issues
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: any, setPreview: (preview: string | null) => void) => {
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

      setIsUploading(true)

      // Use setTimeout to prevent UI freezing during file processing
      setTimeout(() => {
        field.onChange(file)

        const reader = new FileReader()

        reader.onloadend = () => {
          setPreview(reader.result as string)
          setIsUploading(false)
        }

        reader.onerror = () => {
          setIsUploading(false)
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

  // Handle gallery image uploads (multiple files)
  const handleGalleryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      // Check if adding these files would exceed the maximum
      const currentCount = galleryPreviews.length
      const newFilesCount = files.length
      
      if (currentCount + newFilesCount > MAX_GALLERY_IMAGES) {
        toast({
          title: "Too many images",
          description: `You can only upload a maximum of ${MAX_GALLERY_IMAGES} gallery images`,
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)

      // Process each file
      const newFiles: File[] = []
      const newPreviews: string[] = []
      
      // Use Array.from to convert FileList to Array
      Array.from(files).forEach((file) => {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 5MB size limit`,
            variant: "destructive",
          })
          return
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          })
          return
        }

        // Add the file to our array
        newFiles.push(file)

        // Create a preview
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result as string)
          
          // When all files are processed, update form and state
          if (newPreviews.length === newFiles.length) {
            const updatedGallery = [...form.getValues().gallery || [], ...newFiles]
            form.setValue('gallery', updatedGallery)
            setGalleryPreviews((prev) => [...prev, ...newPreviews])
            setIsUploading(false)
          }
        }
        reader.readAsDataURL(file)
      })
    },
    [form, galleryPreviews]
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

      setIsUploading(true)

      // Use setTimeout to prevent UI freezing
      setTimeout(() => {
        field.onChange(file)
        setPitchDeckName(file.name)
        setIsUploading(false)
      }, 50)
    },
    [form],
  )

  const clearFile = useCallback(
    (field: any, setPreview: (preview: string | null) => void, inputRef: React.RefObject<HTMLInputElement>) => {
      field.onChange(null)
      setPreview(null)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [],
  )

  const clearPitchDeck = useCallback((field: any, inputRef: React.RefObject<HTMLInputElement>) => {
    field.onChange(null)
    setPitchDeckName(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [])

  // Remove a gallery image at a specific index
  const removeGalleryImage = useCallback((index: number) => {
    setGalleryPreviews((prev) => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
    })
    
    form.setValue('gallery', form.getValues().gallery.filter((_, i) => i !== index))
  }, [form])

  const handleSubmit = (data: MediaUploadFormValues) => {
    onSubmit(data, true)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 w-full max-w-5xl mx-auto">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Media & Social Links</h2>
          <p className="text-muted-foreground">Upload your startup's media assets and add social media links.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Logo Section */}
          <div className="space-y-4 p-6 bg-muted/10 rounded-lg border">
            <h3 className="text-lg font-medium">Company Logo</h3>
            <p className="text-sm text-muted-foreground">
              Your main brand identifier displayed throughout the platform.
            </p>

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col items-center space-y-2">
                      {logoPreview ? (
                        <div className="relative w-40 h-40">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain rounded-md border"
                          />
                          <button
                            type="button"
                            onClick={() => clearFile(field, setLogoPreview, logoInputRef)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-40 h-40 border-2 border-dashed rounded-md border-muted-foreground/25">
                            {isUploading ? (
                              <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                            )}
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
                              disabled={isUploading}
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

          {/* Banner Image Section */}
          <div className="space-y-4 p-6 bg-muted/10 rounded-lg border">
            <h3 className="text-lg font-medium">Banner Image</h3>
            <p className="text-sm text-muted-foreground">This image appears at the top of your profile page.</p>

            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col items-center space-y-2">
                      {bannerPreview ? (
                        <div className="relative w-full h-32">
                          <img
                            src={bannerPreview}
                            alt="Banner image preview"
                            className="w-full h-full object-cover rounded-md border"
                          />
                          <button
                            type="button"
                            onClick={() => clearFile(field, setBannerPreview, bannerInputRef)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center w-full">
                          <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-muted-foreground/25">
                            {isUploading ? (
                              <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                            ) : (
                              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                            )}
                          </div>
                          <label htmlFor="banner-upload" className="cursor-pointer mt-2">
                            <div className="flex items-center gap-1 text-sm text-primary">
                              <Upload className="h-4 w-4" />
                              <span>Upload Banner</span>
                            </div>
                            <Input
                              id="banner-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(e, field, setBannerPreview)}
                              disabled={isUploading}
                              ref={bannerInputRef}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>Recommended size: 1200x300px (max 5MB)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Gallery Images Section */}
        <div className="space-y-4 p-6 bg-muted/10 rounded-lg border">
          <h3 className="text-lg font-medium">Gallery Images</h3>
          <p className="text-sm text-muted-foreground">
            Add up to {MAX_GALLERY_IMAGES} images to showcase your product, team, or workspace.
          </p>

          <FormField
            control={form.control}
            name="gallery"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    {galleryPreviews.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={preview}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        {galleryPreviews.length < MAX_GALLERY_IMAGES && (
                          <label 
                            htmlFor="gallery-upload" 
                            className="cursor-pointer flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md border-muted-foreground/25 hover:bg-muted/20 transition-colors"
                          >
                            <PlusCircle className="h-8 w-8 text-primary/60 mb-2" />
                            <span className="text-sm text-muted-foreground">Add Image</span>
                            <Input
                              id="gallery-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              multiple
                              onChange={handleGalleryChange}
                              disabled={isUploading}
                              ref={galleryInputRef}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full p-8">
                        <div className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-md border-muted-foreground/25 mb-4">
                          {isUploading ? (
                            <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                          ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                          )}
                        </div>
                        <label htmlFor="gallery-upload" className="cursor-pointer">
                          <Button type="button" className="gap-2">
                            <Upload className="h-4 w-4" />
                            <span>Upload Gallery Images</span>
                          </Button>
                          <Input
                            id="gallery-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            multiple
                            onChange={handleGalleryChange}
                            disabled={isUploading}
                            ref={galleryInputRef}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>Add images of your product, team, or workspace (PNG or JPG, max 5MB each)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Media Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pitch Deck Section */}
          <div className="space-y-4 p-6 bg-muted/10 rounded-lg border">
            <h3 className="text-lg font-medium">Pitch Deck</h3>
            <p className="text-sm text-muted-foreground">Upload your startup's pitch deck.</p>

            <FormField
              control={form.control}
              name="pitchDeck"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col items-center space-y-2">
                      {pitchDeckName ? (
                        <div className="relative flex items-center p-3 w-full border rounded-md bg-muted/5">
                          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[calc(100%-3rem)]">{pitchDeckName}</span>
                          <button
                            type="button"
                            onClick={() => clearPitchDeck(field, pitchDeckInputRef)}
                            className="ml-auto bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center w-full">
                          <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md border-muted-foreground/25">
                            {isUploading ? (
                              <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                            ) : (
                              <FileText className="h-10 w-10 text-muted-foreground/50" />
                            )}
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
                              disabled={isUploading}
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
          </div>

          {/* Demo Video Section */}
          <div className="space-y-4 p-6 bg-muted/10 rounded-lg border">
            <h3 className="text-lg font-medium">Demo Video</h3>
            <p className="text-sm text-muted-foreground">Add a link to your demo or pitch video.</p>

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
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

        {/* Social Links Section */}
        <div className="space-y-4 p-6 bg-muted/10 rounded-lg border">
          <h3 className="text-lg font-medium">Social Links</h3>
          <p className="text-sm text-muted-foreground">Connect your social media accounts.</p>

          <div className="grid md:grid-cols-2 gap-4">
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

        {!hideButtons && (
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 pb-6">
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
