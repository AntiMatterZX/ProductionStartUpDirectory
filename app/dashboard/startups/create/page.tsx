"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, ArrowRight, CheckCircle2, 
  Save, Building2, ClipboardList, 
  Image as ImageIcon, Send
} from 'lucide-react'
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Loader from "@/components/ui/loader"
import type { StartupFormData } from "@/types/startup"
import type { Database } from "@/types/database"

// Import step components
import BasicInfoForm from "./basic-info/form"
import DetailedInfoForm from "./detailed-info/form"
import MediaUploadForm from "./media-upload/form"

export default function CreateStartupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Form data state
  const [formData, setFormData] = useState<StartupFormData>({
    basicInfo: {
      name: "",
      slug: "",
      tagline: "",
      industry: 0,
      foundingDate: "",
      website: "",
    },
    detailedInfo: {
      description: "",
      fundingStage: "",
      fundingAmount: "",
      teamSize: "",
      location: "",
      lookingFor: [],
    },
    mediaInfo: {
      logo: null,
      banner: null,
      gallery: [],
      pitchDeck: null,
      videoUrl: "",
      socialLinks: {
        linkedin: "",
        twitter: "",
      },
    },
  })

  // Form validity tracking
  const [formValidity, setFormValidity] = useState({
    step1: false,
    step2: false,
    step3: false,
  })

  // Check authentication on page load
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please log in to create a startup",
            variant: "destructive",
          })
          router.push("/login?redirect=/dashboard/startups/create")
          return
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  // Handle form submission for each step
  const handleStepSubmit = (step: number, data: any, isValid: boolean) => {
    switch (step) {
      case 1:
        setFormData(prev => ({ ...prev, basicInfo: data }))
        setFormValidity(prev => ({ ...prev, step1: isValid }))
        if (isValid) setCurrentStep(2)
        break
      case 2:
        setFormData(prev => ({ ...prev, detailedInfo: data }))
        setFormValidity(prev => ({ ...prev, step2: isValid }))
        if (isValid) setCurrentStep(3)
        break
      case 3:
        setFormData(prev => ({ ...prev, mediaInfo: data }))
        setFormValidity(prev => ({ ...prev, step3: isValid }))
        if (isValid) setCurrentStep(4)
        break
    }
  }

  // Handle back button click
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Submit the complete form
  const handleFinalSubmit = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      // Verify session is still valid
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Your session has expired. Please log in again",
          variant: "destructive",
        })
        router.push("/login?redirect=/dashboard/startups/create")
        return
      }

      // Prepare form data for submission
      const formDataObj = new FormData()
      formDataObj.append("basicInfo", JSON.stringify(formData.basicInfo))
      formDataObj.append("detailedInfo", JSON.stringify(formData.detailedInfo))

      // Handle file uploads
      if (formData.mediaInfo.logo) {
        formDataObj.append("logo", formData.mediaInfo.logo)
      }

      if (formData.mediaInfo.banner) {
        formDataObj.append("banner", formData.mediaInfo.banner)
      }

      if (formData.mediaInfo.gallery && formData.mediaInfo.gallery.length > 0) {
        formData.mediaInfo.gallery.forEach(file => {
          formDataObj.append("gallery", file)
        })
      }

      if (formData.mediaInfo.pitchDeck) {
        formDataObj.append("pitchDeck", formData.mediaInfo.pitchDeck)
      }

      // Add remaining media info
      const mediaInfoCopy = { ...formData.mediaInfo }
      delete mediaInfoCopy.logo
      delete mediaInfoCopy.banner
      delete mediaInfoCopy.gallery
      delete mediaInfoCopy.pitchDeck
      formDataObj.append("mediaInfo", JSON.stringify(mediaInfoCopy))

      // Submit the form
      const response = await fetch("/api/startups", {
        method: "POST",
        body: formDataObj,
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "Failed to create startup")
      }

      toast({
        title: "Success!",
        description: "Your startup has been created successfully.",
      })

      router.push(`/dashboard/startups/${responseData.id}`)
    } catch (error: any) {
      console.error("Error creating startup:", error)
      
      let errorMessage = "There was a problem creating your startup."
      if (error.message.includes("storage") || error.message.includes("bucket")) {
        errorMessage = "File upload failed. Please try using smaller files or a different format."
      } else if (error.message.includes("database")) {
        errorMessage = "Database error. Please check your input and try again."
      } else if (error.message.includes("slug")) {
        errorMessage = "The startup URL slug is already taken. Please choose a different name."
      }

      toast({
        title: "Error",
        description: error.message || errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader variant="psychedelic" size="md" />
      </div>
    )
  }

  // Define step content and navigation
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container max-w-4xl py-8 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Startup</h1>
          <p className="text-muted-foreground">Complete the form below to add your startup to our platform.</p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2
                    ${currentStep >= step 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground/40 text-muted-foreground'
                    }`}
                >
                  {step === 1 && <Building2 className="h-5 w-5" />}
                  {step === 2 && <ClipboardList className="h-5 w-5" />}
                  {step === 3 && <ImageIcon className="h-5 w-5" />}
                  {step === 4 && <CheckCircle2 className="h-5 w-5" />}
                </div>
                <span className={`text-xs font-medium ${currentStep >= step ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step === 1 && "Basic Info"}
                  {step === 2 && "Details"}
                  {step === 3 && "Media"}
                  {step === 4 && "Review"}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 h-1 bg-muted w-full rounded">
              <div 
                className="h-1 bg-primary rounded transition-all duration-300" 
                style={{ width: `${(currentStep - 1) * 33.33}%` }}
              />
            </div>
          </div>
        </div>

        <Card className="shadow-sm border border-border">
          <div className="p-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <BasicInfoForm 
                onSubmit={(data, isValid) => handleStepSubmit(1, data, isValid)} 
                initialData={formData.basicInfo}
                hideButtons={false}
              />
            )}

            {/* Step 2: Detailed Info */}
            {currentStep === 2 && (
              <DetailedInfoForm
                onSubmit={(data) => handleStepSubmit(2, data, true)}
                onBack={handleBack}
                initialData={formData.detailedInfo}
                hideButtons={false}
              />
            )}

            {/* Step 3: Media Upload */}
            {currentStep === 3 && (
              <MediaUploadForm
                onSubmit={(data, isValid) => handleStepSubmit(3, data, isValid)}
                onBack={handleBack}
                initialData={formData.mediaInfo}
                isSubmitting={isSubmitting}
                hideButtons={false}
              />
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-center py-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Please review your information before submitting. You can go back to edit any section if needed.
                  </p>
                </div>

                <div className="space-y-4 my-6">
                  {/* Basic Info Summary */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold flex items-center mb-3">
                      <Building2 className="mr-2 h-5 w-5 text-primary" />
                      Basic Information
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Startup Name</p>
                          <p className="font-medium">{formData.basicInfo.name || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">URL Slug</p>
                          <p className="font-medium">{formData.basicInfo.slug || "Not provided"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tagline</p>
                        <p className="font-medium">{formData.basicInfo.tagline || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Info Summary */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold flex items-center mb-3">
                      <ClipboardList className="mr-2 h-5 w-5 text-primary" />
                      Detailed Information
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{formData.detailedInfo.location || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Funding Stage</p>
                          <p className="font-medium">{formData.detailedInfo.fundingStage || "Not provided"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="font-medium line-clamp-2">{formData.detailedInfo.description || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Media Info Summary */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold flex items-center mb-3">
                      <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                      Media Assets
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Logo</p>
                        <div className="h-16 flex items-center justify-center">
                          {formData.mediaInfo.logo ? (
                            <div className="border rounded-md p-1 inline-block bg-background">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Banner</p>
                        <div className="h-16 flex items-center justify-center">
                          {formData.mediaInfo.banner ? (
                            <div className="border rounded-md p-1 inline-block bg-background">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Gallery Images</p>
                        <div className="h-16 flex items-center justify-center">
                          {formData.mediaInfo.gallery && formData.mediaInfo.gallery.length > 0 ? (
                            <div className="border rounded-md p-1 inline-block bg-background">
                              <span className="font-medium">{formData.mediaInfo.gallery.length}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader variant="spinner" size="sm" center={false} className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Startup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
