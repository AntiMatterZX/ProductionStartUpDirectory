"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, Save } from "lucide-react"
import type { StartupFormData } from "@/types/startup"

interface ReviewFormProps {
  formData: StartupFormData
  onSubmit: (data: StartupFormData) => void
  onBack: () => void
  isSubmitting: boolean
}

export default function ReviewForm({ formData, onSubmit, onBack, isSubmitting }: ReviewFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-4">
        <div className="bg-primary/10 p-4 rounded-full">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Ready to Submit</h2>
        <p className="text-muted-foreground">
          Please review your information before final submission
        </p>
      </div>

      <div className="space-y-4 my-4">
        <h3 className="font-medium">Basic Information</h3>
        <Card className="p-4">
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p>{formData.basicInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">URL Slug</p>
                <p>{formData.basicInfo.slug}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tagline</p>
              <p>{formData.basicInfo.tagline}</p>
            </div>
          </div>
        </Card>
        
        <h3 className="font-medium">Detailed Information</h3>
        <Card className="p-4">
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p>{formData.detailedInfo.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funding Stage</p>
                <p>{formData.detailedInfo.fundingStage}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Looking For</p>
              <p>{formData.detailedInfo.lookingFor.join(', ') || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="line-clamp-3">{formData.detailedInfo.description}</p>
            </div>
          </div>
        </Card>

        <h3 className="font-medium">Media Information</h3>
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Logo</p>
              <p>{formData.mediaInfo.logo ? "Uploaded ✓" : "None"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cover Image</p>
              <p>{formData.mediaInfo.coverImage ? "Uploaded ✓" : "None"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pitch Deck</p>
              <p>{formData.mediaInfo.pitchDeck ? "Uploaded ✓" : "None"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Video URL</p>
              <p>{formData.mediaInfo.videoUrl || "None"}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          type="button"
          onClick={() => onSubmit(formData)}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
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
  )
} 