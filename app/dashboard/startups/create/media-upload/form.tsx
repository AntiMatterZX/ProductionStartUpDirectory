"use client"

import { useState, useCallback, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Upload, X, ImageIcon, FileText, LinkIcon, 
  Loader2, ArrowLeft, ArrowRight, PlusCircle 
} from "lucide-react"
import { mediaUploadSchema, type MediaUploadFormValues } from "@/lib/validations/startup"
import type { StartupMediaInfo } from "@/types/startup"
import { toast } from "@/components/ui/use-toast"
import LoadingIndicator from "@/components/ui/loading-indicator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [activeTab, setActiveTab] = useState("branding")

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const pitchDeckInputRef = useRef<HTMLInputElement>(null)

  // Setup form with validation
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

  // Handle file upload for logo and banner
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

      // Process the file asynchronously to avoid UI freeze
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

  // Handle pitch deck upload
  const handlePitchDeckChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
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

      // Validate file type for documents
      const acceptedTypes = [
          "application/pdf",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ]
      
      if (!acceptedTypes.includes(file.type)) {
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

      setTimeout(() => {
        field.onChange(file)
        setPitchDeckName(file.name)
        setIsUploading(false)
      }, 50)
    },
    [form],
  )

  // Clear file handlers
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

  const clearPitchDeck = useCallback(
    (field: any, inputRef: React.RefObject<HTMLInputElement>) => {
    field.onChange(null)
    setPitchDeckName(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    }, 
    []
  )

  // Remove a gallery image
  const removeGalleryImage = useCallback(
    (index: number) => {
      setGalleryPreviews((prev) => {
        const updated = [...prev]
        updated.splice(index, 1)
        return updated
      })
      
      form.setValue(
        'gallery', 
        form.getValues().gallery.filter((_, i) => i !== index)
      )
    }, 
    [form]
  )

  // Form submission handler
  const handleSubmit = (data: MediaUploadFormValues) => {
    onSubmit(data, true)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 sm:space-y-8">
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary/80 to-primary">Media & Links</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Add visual content and social links to showcase your startup.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-4 bg-muted p-1">
            <TabsTrigger value="branding" className="data-[state=active]:bg-background">
              <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-background">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-background">
              <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Links</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Logo Upload */}
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Company Logo</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div 
                          className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={logoInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, field, setLogoPreview)}
                          />
                          <div className="flex flex-col items-center justify-center gap-2">
                            {logoPreview ? (
                              <div className="relative w-32 h-32">
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-full h-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    field.onChange(null)
                                    setLogoPreview(null)
                                  }}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground text-center">
                                  Click to upload your logo
                                  <br />
                                  <span className="text-xs">SVG, PNG, or JPG (max 5MB)</span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banner Upload */}
              <FormField
                control={form.control}
                name="banner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Banner Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div 
                          className="border-2 border-dashed rounded-lg aspect-video hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                          onClick={() => bannerInputRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={bannerInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, field, setBannerPreview)}
                          />
                          <div className="flex flex-col items-center justify-center h-full gap-2">
                            {bannerPreview ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={bannerPreview}
                                  alt="Banner preview"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    field.onChange(null)
                                    setBannerPreview(null)
                                  }}
                                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground text-center">
                                  Click to upload a banner image
                                  <br />
                                  <span className="text-xs">Recommended size: 1200x630px (max 5MB)</span>
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pitch Deck Upload */}
            <FormField
              control={form.control}
              name="pitchDeck"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Pitch Deck</FormLabel>
                  <FormControl>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                      onClick={() => pitchDeckInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={pitchDeckInputRef}
                        className="hidden"
                        accept=".pdf,.ppt,.pptx"
                        onChange={(e) => handlePitchDeckChange(e, field)}
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        {pitchDeckName ? (
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <span className="text-sm font-medium">{pitchDeckName}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                field.onChange(null)
                                setPitchDeckName(null)
                              }}
                              className="bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground text-center">
                              Click to upload your pitch deck
                              <br />
                              <span className="text-xs">PDF or PowerPoint (max 5MB)</span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <FormField
              control={form.control}
              name="gallery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Gallery Images</FormLabel>
                  <FormDescription className="text-sm">
                    Upload up to {MAX_GALLERY_IMAGES} images to showcase your startup
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted/30">
                            <img
                              src={preview}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newGallery = [...field.value]
                                newGallery.splice(index, 1)
                                field.onChange(newGallery)
                                const newPreviews = [...galleryPreviews]
                                newPreviews.splice(index, 1)
                                setGalleryPreviews(newPreviews)
                              }}
                              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {galleryPreviews.length < MAX_GALLERY_IMAGES && (
                          <div
                            className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                            onClick={() => galleryInputRef.current?.click()}
                          >
                            <input
                              type="file"
                              ref={galleryInputRef}
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={handleGalleryChange}
                            />
                            <PlusCircle className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground text-center">
                              Add Image
                              <br />
                              <span className="text-xs">Max 5MB each</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            {/* Video URL */}
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Video URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://youtube.com/watch?v=..." 
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription className="text-sm">
                    Add a YouTube or Vimeo video showcasing your startup
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social Links */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="socialLinks.linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">LinkedIn</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://linkedin.com/company/..." 
                        {...field}
                        className="text-base"
                      />
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
                    <FormLabel className="text-base">Twitter</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://twitter.com/..." 
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {!hideButtons && (
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 sm:pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
              className="gap-2 text-base"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Details
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              size="lg"
              className="gap-2 text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
