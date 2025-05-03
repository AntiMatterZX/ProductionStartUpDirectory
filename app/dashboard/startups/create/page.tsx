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
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import ReviewForm from "./review/form"

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
      logo: undefined,
      coverImage: undefined,
      pitchDeck: undefined,
      videoUrl: "",
      socialLinks: {
        linkedin: "",
        twitter: "",
      },
    },
  })

  // New state for form validity
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

  const handleNext = (data: any, step: number, isValid: boolean = true) => {
    // Update form validity state
    if (step === 1) {
      setFormData((prev) => ({ ...prev, basicInfo: data }))
      setFormValidity((prev) => ({ ...prev, step1: isValid }))
      if (isValid) setCurrentStep(2)
    } else if (step === 2) {
      setFormData((prev) => ({ ...prev, detailedInfo: data }))
      setFormValidity((prev) => ({ ...prev, step2: isValid }))
      if (isValid) setCurrentStep(3)
    } else if (step === 3) {
      setFormData((prev) => ({ ...prev, mediaInfo: data }))
      setFormValidity((prev) => ({ ...prev, step3: isValid }))
      if (isValid) setCurrentStep(4) // Go to review step
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (completeData: StartupFormData) => {
    try {
      setIsSubmitting(true)

      // Check authentication status again before submitting
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Your session has expired. Please log in again to create a startup",
          variant: "destructive",
        })
        router.push("/login?redirect=/dashboard/startups/create")
        return
      }

      // Create a FormData object to handle file uploads
      const formData = new FormData()

      // Add basic info and detailed info as JSON strings
      formData.append("basicInfo", JSON.stringify(completeData.basicInfo))
      formData.append("detailedInfo", JSON.stringify(completeData.detailedInfo))

      // Handle media info separately to properly handle files
      const mediaInfoCopy = { ...completeData.mediaInfo }

      // Add files directly to FormData
      if (completeData.mediaInfo.logo) {
        formData.append("logo", completeData.mediaInfo.logo)
      }

      if (completeData.mediaInfo.coverImage) {
        formData.append("coverImage", completeData.mediaInfo.coverImage)
      }

      if (completeData.mediaInfo.pitchDeck) {
        formData.append("pitchDeck", completeData.mediaInfo.pitchDeck)
      }

      // Remove file objects from the JSON representation
      delete mediaInfoCopy.logo
      delete mediaInfoCopy.coverImage
      delete mediaInfoCopy.pitchDeck

      // Add the remaining media info as a JSON string
      formData.append("mediaInfo", JSON.stringify(mediaInfoCopy))

      const response = await fetch("/api/startups", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create startup")
      }

      const data = await response.json()

      toast({
        title: "Success!",
        description: "Your startup has been created successfully.",
      })

      router.push(`/dashboard/startups/${data.id}`)
    } catch (error: any) {
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Create Your Startup Profile</h1>
        <p className="text-muted-foreground">Complete each section to create your startup profile.</p>
      </div>

      <div className="w-full overflow-x-auto pb-2">
        <FormStepper 
          currentStep={currentStep}
          totalSteps={totalSteps}
          titles={stepTitles}
          onStepClick={handleStepChange}
          validSteps={{
            1: true,
            2: formValidity.step1,
            3: formValidity.step1 && formValidity.step2,
            4: formValidity.step1 && formValidity.step2 && formValidity.step3,
          }}
        />
      </div>

      <Card className="max-w-full">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <BasicInfoForm
                  onSubmit={(data) => handleNext(data, 1, true)}
                  initialData={formData.basicInfo}
                />
              )}

              {currentStep === 2 && (
                <DetailedInfoForm
                  onSubmit={(data) => handleNext(data, 2, true)}
                  onBack={handleBack}
                  initialData={formData.detailedInfo}
                />
              )}

              {currentStep === 3 && (
                <MediaUploadForm
                  onSubmit={(data) => handleNext(data, 3, true)}
                  onBack={handleBack}
                  initialData={formData.mediaInfo}
                  isSubmitting={isSubmitting}
                />
              )}

              {currentStep === 4 && (
                <ReviewForm
                  formData={formData}
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <div>
          Step {currentStep} of {totalSteps}
        </div>
        
        <div className="flex items-center gap-2">
          {currentStep < totalSteps ? (
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} disabled={currentStep === 1}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          ) : (
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
