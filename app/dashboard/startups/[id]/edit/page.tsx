"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import FormStepper from "@/components/startup/creation/FormStepper"
import BasicInfoForm from "../../create/basic-info/form"
import DetailedInfoForm from "../../create/detailed-info/form"
import MediaUploadForm from "../../create/media-upload/form"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import type { StartupFormData } from "@/types/startup"
import type { Database } from "@/types/database"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react"
import type { BasicInfoFormValues, DetailedInfoFormValues, MediaUploadFormValues } from "@/lib/validations/startup"

// Custom interface to extend FormStepper component with completedSteps
interface ExtendedFormStepperProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  onStepChange?: (step: number) => void;
  completedSteps?: {
    [key: number]: boolean;
  };
}

// Create a modified FormStepper component that accepts completedSteps
const EnhancedFormStepper = (props: ExtendedFormStepperProps) => {
  const { completedSteps, ...restProps } = props;
  return <FormStepper {...restProps} />;
};

export default function EditStartupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const startupId = params.id
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

  // State for form validity
  const [formValidity, setFormValidity] = useState({
    step1: false,
    step2: false,
    step3: false
  })

  const totalSteps = 4
  const stepTitles = ["Basic Info", "Detailed Info", "Media Upload", "Review"]

  // Fetch startup data and populate form
  useEffect(() => {
    async function fetchStartupData() {
      try {
        setIsLoading(true);
        
        // Check authentication first
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please log in to edit a startup",
            variant: "destructive",
          })
          router.push(`/login?redirect=/dashboard/startups/${startupId}/edit`)
          return
        }

        // Fetch the startup data
        const { data: startup, error } = await supabase
          .from("startups")
          .select(`
            *,
            categories(id, name),
            startup_looking_for(option_id, looking_for_options(id, name)),
            social_links(id, platform, url)
          `)
          .eq("id", startupId)
          .single()

        if (error) {
          console.error("Database error fetching startup:", error);
          
          // Handle specific error codes
          if (error.code === 'PGRST116') {
            // This is the "not found" error code
            throw new Error("Startup not found. It may have been deleted or never existed.");
          } else {
            throw new Error(`Database error: ${error.message}`);
          }
        }

        if (!startup) {
          throw new Error("Startup not found. It may have been deleted.");
        }

        // Check if the user owns this startup
        if (startup.user_id !== session.user.id) {
          throw new Error("You don't have permission to edit this startup");
        }

        // Map database data to form structure
        const lookingForOptions = startup.startup_looking_for?.map(
          (item: any) => item.option_id
        ) || [];

        const socialLinks = {
          linkedin: "",
          twitter: "",
        };

        // Extract social links
        if (startup.social_links && Array.isArray(startup.social_links)) {
          startup.social_links.forEach((link: any) => {
            if (link.platform === "linkedin") {
              socialLinks.linkedin = link.url || "";
            }
            if (link.platform === "twitter") {
              socialLinks.twitter = link.url || "";
            }
          });
        }

        // Convert founding date to YYYY-MM-DD format for input field
        let formattedFoundingDate = "";
        if (startup.founding_date) {
          try {
            const date = new Date(startup.founding_date);
            formattedFoundingDate = date.toISOString().split('T')[0];
          } catch (e) {
            console.error("Invalid date format:", startup.founding_date);
            formattedFoundingDate = new Date().toISOString().split('T')[0]; // Fallback to today
          }
        }

        // Populate form data
        setFormData({
          basicInfo: {
            name: startup.name || "",
            slug: startup.slug || "",
            tagline: startup.tagline || "",
            industry: startup.category_id || 0,
            foundingDate: formattedFoundingDate,
            website: startup.website_url || "",
          },
          detailedInfo: {
            description: startup.description || "",
            fundingStage: startup.funding_stage || "",
            fundingAmount: startup.funding_amount?.toString() || "",
            teamSize: startup.employee_count?.toString() || "",
            location: startup.location || "",
            lookingFor: lookingForOptions,
          },
          mediaInfo: {
            logo: undefined, // Can't prefill file inputs
            coverImage: undefined,
            pitchDeck: undefined,
            videoUrl: startup.video_url || "", 
            socialLinks: socialLinks,
          },
        });

        // Mark form as pre-filled for validation
        setFormValidity({
          step1: true,
          step2: true,
          step3: true
        });
        
        console.log("Startup data loaded successfully:", startup.name);
        
      } catch (error: any) {
        console.error("Error fetching startup for editing:", error);
        toast({
          title: "Error loading startup",
          description: error.message || "Failed to load startup data. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => {
          router.push("/dashboard/startups");
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStartupData();
  }, [supabase, startupId, router]);

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

  const handleNext = () => {
    if (currentStep < totalSteps && canProceedToNextStep()) {
      setCurrentStep(currentStep + 1)
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
          description: "Your session has expired. Please log in again to edit a startup",
          variant: "destructive",
        })
        router.push(`/login?redirect=/dashboard/startups/${startupId}/edit`)
        return
      }

      // Create a FormData object to handle file uploads
      const formData = new FormData()
      
      // Add startup ID for update
      formData.append("id", startupId)

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

      console.log("Submitting form data to API...");
      
      try {
        const response = await fetch(`/api/startups/${startupId}`, {
          method: "PUT",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API error response:", errorData);
          throw new Error(errorData.message || `Failed to update startup: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Update successful:", data);

        toast({
          title: "Success!",
          description: "Your startup has been updated successfully.",
        })

        router.push(`/dashboard/startups/${data.id}`)
      } catch (fetchError: any) {
        console.error("Fetch error:", fetchError);
        throw new Error(fetchError.message || "Network error when submitting the form");
      }
    } catch (error: any) {
      console.error("Error updating startup:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem updating your startup.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, x: 10 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
          >
            <BasicInfoForm
              initialData={formData.basicInfo}
              onSubmit={(data: BasicInfoFormValues, isValid: boolean) => {
                updateFormData(1, data);
                updateFormValidity(1, isValid);
              }}
            />
          </motion.div>
        )
      case 2:
        return (
          <motion.div
            key="step2"
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
          >
            <DetailedInfoForm
              initialData={formData.detailedInfo}
              onSubmit={(data: DetailedInfoFormValues) => {
                updateFormData(2, data);
                updateFormValidity(2, true);
              }}
              onBack={handleBack}
            />
          </motion.div>
        )
      case 3:
        return (
          <motion.div
            key="step3"
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
          >
            <MediaUploadForm
              initialData={formData.mediaInfo}
              onSubmit={(data: MediaUploadFormValues) => {
                updateFormData(3, data);
                updateFormValidity(3, true);
              }}
              onBack={handleBack}
            />
          </motion.div>
        )
      case 4:
        return (
          <motion.div
            key="step4"
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
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
                  Please review your information before updating
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
                  <p><span className="font-medium">Logo:</span> {formData.mediaInfo.logo ? "New file uploaded" : "No change"}</p>
                  <p><span className="font-medium">Cover Image:</span> {formData.mediaInfo.coverImage ? "New file uploaded" : "No change"}</p>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => handleSubmit(formData)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Startup
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )
      default:
        return null
    }
  }

  const updateFormData = (step: number, data: any) => {
    switch (step) {
      case 1:
        setFormData(prev => ({ ...prev, basicInfo: data }))
        break
      case 2:
        setFormData(prev => ({ ...prev, detailedInfo: data }))
        break
      case 3:
        setFormData(prev => ({ ...prev, mediaInfo: data }))
        break
    }
  }

  const updateFormValidity = (step: number, isValid: boolean) => {
    switch (step) {
      case 1:
        setFormValidity(prev => ({ ...prev, step1: isValid }))
        break
      case 2:
        setFormValidity(prev => ({ ...prev, step2: isValid }))
        break
      case 3:
        setFormValidity(prev => ({ ...prev, step3: isValid }))
        break
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Startup</h1>
        <p className="text-muted-foreground">Update your startup information</p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <EnhancedFormStepper 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            stepTitles={stepTitles}
            onStepChange={handleStepChange}
            completedSteps={{
              1: formValidity.step1,
              2: formValidity.step2,
              3: formValidity.step3,
              4: false,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            {currentStep === 1 ? (
              <Link href={`/dashboard/startups/${startupId}`}>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}

            {currentStep < totalSteps && (
              <Button onClick={handleNext} disabled={!canProceedToNextStep()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 