"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import FormStepper from "@/components/startup/creation/FormStepper"
import BasicInfoForm from "./basic-info/form"
import DetailedInfoForm from "./detailed-info/form"
import MediaUploadForm from "./media-upload/form"
import ReviewForm from "./review/form"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import type { StartupFormData } from "@/types/startup"
import type { Database } from "@/types/database"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react"

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, x: 10 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  }

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">Create Your Startup</h1>

      <div className="mb-8">
        <FormStepper 
          currentStep={currentStep} 
          totalSteps={totalSteps} 
          stepTitles={stepTitles}
          onStepChange={handleStepChange} 
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
              >
                <BasicInfoForm 
                  onSubmit={(data, isValid) => handleNext(data, 1, isValid)} 
                  initialData={formData.basicInfo} 
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
              >
                <DetailedInfoForm
                  onSubmit={(data, isValid) => handleNext(data, 2, isValid)}
                  initialData={formData.detailedInfo}
                  onBack={handleBack}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
              >
                <MediaUploadForm
                  onSubmit={(data, isValid) => handleNext(data, 3, isValid)}
                  initialData={formData.mediaInfo}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-center py-6">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <CheckCircle2 className="h-12 w-12 text-primary" />
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
                      size="lg" 
                      className="min-w-[100px]" 
                      onClick={handleBack}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      size="lg" 
                      className="min-w-[120px]"
                      onClick={() => handleSubmit(formData)}
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
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
