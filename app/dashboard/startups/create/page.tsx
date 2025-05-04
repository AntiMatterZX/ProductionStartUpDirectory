"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import FormStepper from "@/components/startup/creation/FormStepper"
import BasicInfoForm from "./basic-info/form"
import DetailedInfoForm from "./detailed-info/form"
import MediaUploadForm from "./media-upload/form"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import type { StartupFormData } from "@/types/startup"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Save } from "lucide-react"

export default function CreateStartupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
      coverImage: null,
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
    step3: false
  })

  const totalSteps = 4
  const stepTitles = ["Basic Info", "Detailed Info", "Media Upload", "Review"]

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

  const handleStepChange = (step: number) => {
    // Only allow navigation to previously completed steps or the next available step
    if (step < currentStep || (step === currentStep + 1 && canProceedToNextStep())) {
      setCurrentStep(step)
      
      // Scroll to top when changing steps
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formValidity.step1
      case 2:
        return formValidity.step2
      case 3:
        return formValidity.step3
      default:
        return false
    }
  }

  const handleNext = (data: any, isValid: boolean = true) => {
    // Update form validity state based on current step
    switch (currentStep) {
      case 1:
        setFormData((prev) => ({ ...prev, basicInfo: data }))
        setFormValidity((prev) => ({ ...prev, step1: isValid }))
        if (isValid) {
          setCurrentStep(2)
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        }
        break
      case 2:
        setFormData((prev) => ({ ...prev, detailedInfo: data }))
        setFormValidity((prev) => ({ ...prev, step2: isValid }))
        if (isValid) {
          setCurrentStep(3)
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        }
        break
      case 3:
        setFormData((prev) => ({ ...prev, mediaInfo: data }))
        setFormValidity((prev) => ({ ...prev, step3: isValid }))
        if (isValid) {
          setCurrentStep(4)
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        }
        break
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      })
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true)

      // Check authentication status again before submitting
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

      // Create a FormData object to handle file uploads
      const formDataObj = new FormData()

      // Add basic info and detailed info as JSON strings
      formDataObj.append("basicInfo", JSON.stringify(formData.basicInfo))
      formDataObj.append("detailedInfo", JSON.stringify(formData.detailedInfo))

      // Handle media info separately to properly handle files
      const mediaInfoCopy = { ...formData.mediaInfo }

      // Add files directly to FormData
      if (formData.mediaInfo.logo) {
        formDataObj.append("logo", formData.mediaInfo.logo)
      }

      if (formData.mediaInfo.coverImage) {
        formDataObj.append("coverImage", formData.mediaInfo.coverImage)
      }

      if (formData.mediaInfo.pitchDeck) {
        formDataObj.append("pitchDeck", formData.mediaInfo.pitchDeck)
      }

      // Remove file objects from the JSON representation
      delete mediaInfoCopy.logo
      delete mediaInfoCopy.coverImage
      delete mediaInfoCopy.pitchDeck

      // Add the remaining media info as a JSON string
      formDataObj.append("mediaInfo", JSON.stringify(mediaInfoCopy))

      const response = await fetch("/api/startups", {
        method: "POST",
        body: formDataObj,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create startup")
      }

      const data = await response.json()

      toast({
        title: "Success!",
        description: "Your startup has been created successfully.",
      })

      router.push(`/dashboard/startups/${data.id}`)
    } catch (error: any) {
      console.error("Error creating startup:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem creating your startup.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoForm 
            onSubmit={(data, isValid) => handleNext(data, isValid)} 
            initialData={formData.basicInfo} 
          />
        );
      case 2:
        return (
          <DetailedInfoForm
            onSubmit={(data) => handleNext(data, true)}
            initialData={formData.detailedInfo}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <MediaUploadForm
            onSubmit={(data, isValid) => handleNext(data, isValid)}
            initialData={formData.mediaInfo}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Ready to Submit</h2>
              <p className="text-muted-foreground">
                Please review your information before final submission
              </p>
            </div>

            <div className="space-y-4 my-6">
              <h3 className="font-medium">Basic Information</h3>
              <div className="bg-muted/50 p-4 rounded-md">
                <p><span className="font-medium">Name:</span> {formData.basicInfo.name}</p>
                <p><span className="font-medium">Tagline:</span> {formData.basicInfo.tagline}</p>
              </div>
              
              <h3 className="font-medium">Detailed Information</h3>
              <div className="bg-muted/50 p-4 rounded-md">
                <p><span className="font-medium">Location:</span> {formData.detailedInfo.location}</p>
                <p><span className="font-medium">Funding Stage:</span> {formData.detailedInfo.fundingStage}</p>
              </div>

              <h3 className="font-medium">Media Information</h3>
              <div className="bg-muted/50 p-4 rounded-md">
                <p><span className="font-medium">Logo:</span> {formData.mediaInfo.logo ? "Uploaded" : "None"}</p>
                <p><span className="font-medium">Cover Image:</span> {formData.mediaInfo.coverImage ? "Uploaded" : "None"}</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto py-6">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Create Your Startup Profile</h1>

        <div className="mb-8">
          <FormStepper 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            stepTitles={stepTitles}
            onStepChange={handleStepChange} 
          />
        </div>

        <Card className="shadow-sm mb-6">
          <CardContent className="p-6 md:p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
