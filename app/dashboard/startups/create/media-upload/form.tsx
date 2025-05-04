"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon, FileText, LinkIcon, Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { mediaUploadSchema, type MediaUploadFormValues } from "@/lib/validations/startup"
import type { StartupMediaInfo } from "@/types/startup"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface MediaUploadFormProps {
  onSubmit: (data: MediaUploadFormValues, isValid: boolean) => void
  onBack: () => void
  initialData?: Partial<StartupMediaInfo>
  isSubmitting?: boolean
}

export default function MediaUploadForm({ onSubmit, onBack, initialData = {}, isSubmitting }: MediaUploadFormProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [pitchDeckName, setPitchDeckName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
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

  // Optimized file handling to prevent performance issues
  const handleFileChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
    setPreview: (preview: string | null) => void,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return;
    
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
    if ((field.name === 'logo' || field.name === 'coverImage') && !file.type.startsWith('image/')) {
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
    
    // Validate file type for documents
    if (field.name === 'pitchDeck' && 
        !['application/pdf', 'application/vnd.ms-powerpoint', 
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type)) {
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
    
    // Use setTimeout to prevent UI freezing during file processing
    setTimeout(() => {
      field.onChange(file)
      
      if (file.type.startsWith('image/')) {
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
      } else {
        // For non-image files, just set uploading to false
        setIsUploading(false)
      }
    }, 50)
  }, [form])

  const handlePitchDeckChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const file = e.target.files?.[0]
    if (!file) return;
    
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
    if (!['application/pdf', 'application/vnd.ms-powerpoint', 
           'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type)) {
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
  }, [form])

  const clearFile = useCallback((field: any, setPreview: (preview: string | null) => void, inputRef: React.RefObject<HTMLInputElement>) => {
    field.onChange(null)
    setPreview(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const clearPitchDeck = useCallback((field: any, inputRef: React.RefObject<HTMLInputElement>) => {
    field.onChange(null)
    setPitchDeckName(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const handleSubmit = (data: MediaUploadFormValues) => {
    onSubmit(data, true)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Media & Social Links</h2>
          <p className="text-muted-foreground">
            Upload your startup's logo, cover image, and pitch deck. Add social media links.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
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
                          onClick={() => clearFile(field, setLogoPreview, logoInputRef)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-md border-muted-foreground/25">
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
                    <Input 
                      placeholder="https://youtube.com/watch?v=..."
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>YouTube or Vimeo URL to your startup's demo or pitch video</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                        onClick={() => clearFile(field, setCoverPreview, coverInputRef)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center w-full">
                      <div className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-md border-muted-foreground/25">
                        {isUploading ? (
                          <Loader2 className="h-10 w-10 text-primary/50 animate-spin" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        )}
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
                          disabled={isUploading}
                          ref={coverInputRef}
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

        <div className="space-y-4">
          <h3 className="font-medium">Social Links</h3>
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
                      <Input 
                        placeholder="https://linkedin.com/company/..."
                        className="pl-10"
                        {...field}
                      />
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
                      <Input 
                        placeholder="https://twitter.com/..."
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            size="lg" 
            className="min-w-[100px]" 
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className="min-w-[100px]"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? "Processing..." : "Next"}
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
