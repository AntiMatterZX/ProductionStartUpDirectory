"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BasicInfoForm from "../../create/basic-info/form"
import DetailedInfoForm from "../../create/detailed-info/form"
import MediaUploadForm from "../../create/media-upload/form"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import type { StartupFormData } from "@/types/startup"
import type { Database } from "@/types/database"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Save, Eye, CheckCircle2, Pencil } from "lucide-react"
import type { BasicInfoFormValues, DetailedInfoFormValues, MediaUploadFormValues } from "@/lib/validations/startup"
import LoadingIndicator from "@/components/ui/loading-indicator"
import StartupLogoUpload from "@/app/components/StartupLogoUpload"
import StartupMediaUpload from "@/app/components/StartupMediaUpload"
import { Badge } from "@/components/ui/badge"

export default function EditStartupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const startupId = params.id
  const supabase = createClientComponentClient<Database>()
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [startupData, setStartupData] = useState<any>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
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
            categories(id, name)
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

        // Store startup data for display
        setStartupData(startup);
        setLogoUrl(startup.logo_url || null);

        // Fetch social links separately
        const { data: socialLinksData, error: socialLinksError } = await supabase
          .from("social_links")
          .select("id, platform, url")
          .eq("startup_id", startupId);

        if (socialLinksError) {
          console.error("Error fetching social links:", socialLinksError);
        }

        // Add social links to the startup data
        startup.social_links = socialLinksData || [];

        // Map database data to form structure
        const lookingForOptions = startup.looking_for || [];

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

  const handleSubmit = async (completeData: StartupFormData) => {
    try {
      setIsSubmitting(true);
      
      // Basic input validation
      if (!completeData.basicInfo.name || completeData.basicInfo.name.trim().length < 3) {
        toast({
          title: "Validation Error",
          description: "Startup name is too short",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Get current date in ISO format
      const currentDate = new Date().toISOString();
      
      // Prepare data for database
      const dataToUpdate = {
        name: completeData.basicInfo.name.trim(),
        slug: completeData.basicInfo.slug.trim(),
        tagline: completeData.basicInfo.tagline.trim(),
        category_id: completeData.basicInfo.industry,
        founding_date: completeData.basicInfo.foundingDate,
        website_url: completeData.basicInfo.website.trim(),
        
        // Detailed info
        description: completeData.detailedInfo.description.trim(),
        funding_stage: completeData.detailedInfo.fundingStage,
        funding_amount: completeData.detailedInfo.fundingAmount 
          ? parseFloat(completeData.detailedInfo.fundingAmount) 
          : null,
        employee_count: completeData.detailedInfo.teamSize 
          ? parseInt(completeData.detailedInfo.teamSize) 
          : null,
        location: completeData.detailedInfo.location.trim(),
        looking_for: completeData.detailedInfo.lookingFor,
        
        // Media info - handled separately through API
        video_url: completeData.mediaInfo.videoUrl.trim(),
        
        // Update timestamp
        updated_at: currentDate
      };
      
      // Update the startup record
      const { error: updateError } = await supabase
        .from("startups")
        .update(dataToUpdate)
        .eq("id", startupId);
      
      if (updateError) {
        throw new Error(`Failed to update startup: ${updateError.message}`);
      }
      
      // Handle social links
      try {
        // First, delete existing links (simple approach)
        await supabase
          .from("social_links")
          .delete()
          .eq("startup_id", startupId);
        
        // Insert new links if present
        const socialLinks = [];
        
        if (completeData.mediaInfo.socialLinks.linkedin) {
          socialLinks.push({
            startup_id: startupId,
            platform: "linkedin",
            url: completeData.mediaInfo.socialLinks.linkedin.trim(),
          });
        }
        
        if (completeData.mediaInfo.socialLinks.twitter) {
          socialLinks.push({
            startup_id: startupId,
            platform: "twitter",
            url: completeData.mediaInfo.socialLinks.twitter.trim(),
          });
        }
        
        if (socialLinks.length > 0) {
          const { error: socialLinkError } = await supabase
            .from("social_links")
            .insert(socialLinks);
            
          if (socialLinkError) {
            console.error("Error updating social links:", socialLinkError);
          }
        }
      } catch (socialError) {
        console.error("Error managing social links:", socialError);
        // Don't fail the entire operation for social link errors
      }

      toast({
        title: "Startup updated",
        description: "Your startup has been updated successfully",
      });
      
      // Navigate back to view page
      router.push(`/dashboard/startups/${startupId}`);
      
    } catch (error: any) {
      console.error("Error updating startup:", error);
      toast({
        title: "Update failed",
        description: error.message || "There was a problem updating your startup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleLogoUploaded(url: string) {
    setLogoUrl(url);
    toast({
      title: "Logo uploaded",
      description: "Your startup logo has been updated"
    });
  }

  function handleMediaUploaded(url: string) {
    toast({
      title: "Media uploaded",
      description: "Your media has been added to the startup"
    });
  }

  const updateFormData = (step: number, data: any) => {
    if (step === 1) {
      setFormData(prev => ({
        ...prev,
        basicInfo: data
      }))
    } else if (step === 2) {
      setFormData(prev => ({
        ...prev,
        detailedInfo: data
      }))
    } else if (step === 3) {
      setFormData(prev => ({
        ...prev,
        mediaInfo: data
      }))
    }
  }

  const updateFormValidity = (step: number, isValid: boolean) => {
    if (step === 1) {
      setFormValidity(prev => ({ ...prev, step1: isValid }))
    } else if (step === 2) {
      setFormValidity(prev => ({ ...prev, step2: isValid }))
    } else if (step === 3) {
      setFormValidity(prev => ({ ...prev, step3: isValid }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <LoadingIndicator size="lg" />
        <p className="text-muted-foreground mt-4">Loading startup data...</p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{startupData?.name || "Edit Startup"}</h1>
          <p className="text-muted-foreground mt-1">{startupData?.tagline || "A short, catchy description for my startup"}</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Button asChild variant="outline" className="flex-1 sm:flex-initial justify-center">
            <Link href={`/startups/${startupData?.slug || startupId}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              View Public Page
            </Link>
          </Button>
          
          <Button asChild className="flex-1 sm:flex-initial justify-center">
            <Link href={`/dashboard/startups/${startupId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Startup
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Media */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Media</h2>
                <p className="text-sm text-muted-foreground">
                  Upload and manage your startup's media assets
                </p>
                
                <Tabs defaultValue="logo" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4 w-full">
                    <TabsTrigger value="logo" className="text-xs sm:text-sm">Logo & Images</TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
                    <TabsTrigger value="videos" className="text-xs sm:text-sm">Videos & Links</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="logo" className="space-y-6">
                    {/* Company Logo Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h3 className="font-medium">Company Logo</h3>
                        <StartupLogoUpload 
                          startupId={startupId}
                          userId={startupData?.user_id || ""}
                          currentLogoUrl={logoUrl}
                          onUploaded={handleLogoUploaded}
                          buttonText="Upload Logo"
                          className="flex items-center gap-1"
                        />
                      </div>
                      
                      <div className="border rounded-md p-4 sm:p-6 flex items-center justify-center bg-muted/20">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Company Logo"
                            className="max-w-[120px] sm:max-w-[180px] max-h-[120px] sm:max-h-[180px] object-contain"
                          />
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p>No logo uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Images Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h3 className="font-medium">Images</h3>
                        <StartupMediaUpload
                          startupId={startupId}
                          userId={startupData?.user_id || ""}
                          mediaType="image"
                          onUploaded={handleMediaUploaded}
                          buttonLabel="Upload Image"
                        />
                      </div>
                      
                      <div className="border rounded-md p-4 sm:p-6 flex items-center justify-center bg-muted/20 min-h-[200px]">
                        {startupData?.media_images && startupData.media_images.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {startupData.media_images.map((imageUrl: string, index: number) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`Startup image ${index + 1}`}
                                className="w-full h-[100px] object-cover rounded-md"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p>No images uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h3 className="font-medium">Documents</h3>
                      <StartupMediaUpload
                        startupId={startupId}
                        userId={startupData?.user_id || ""}
                        mediaType="document"
                        onUploaded={handleMediaUploaded}
                        buttonLabel="Upload Document"
                      />
                    </div>
                    
                    <div className="border rounded-md p-4 sm:p-6 bg-muted/20 min-h-[200px]">
                      {startupData?.media_documents && startupData.media_documents.length > 0 ? (
                        <div className="space-y-3">
                          {startupData.media_documents.map((docUrl: string, index: number) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-background rounded-md border">
                              <span className="truncate max-w-[150px] sm:max-w-none">{docUrl.split('/').pop()}</span>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={docUrl} target="_blank" rel="noopener noreferrer">View</a>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground flex items-center justify-center h-[200px]">
                          <p>No documents uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="videos" className="space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <h3 className="font-medium">Videos</h3>
                      <StartupMediaUpload
                        startupId={startupId}
                        userId={startupData?.user_id || ""}
                        mediaType="video"
                        onUploaded={handleMediaUploaded}
                        buttonLabel="Add Video"
                      />
                    </div>
                    
                    <div className="border rounded-md p-4 sm:p-6 bg-muted/20 min-h-[200px]">
                      {formData.mediaInfo.videoUrl ? (
                        <div className="aspect-video overflow-hidden rounded-md">
                          <iframe
                            width="100%"
                            height="100%"
                            src={formData.mediaInfo.videoUrl}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground flex items-center justify-center h-[200px]">
                          <p>No videos added yet</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Startup Details */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Startup Details</h2>
                
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4 w-full">
                    <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic Info</TabsTrigger>
                    <TabsTrigger value="detailed" className="text-xs sm:text-sm">Additional Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic">
                    <BasicInfoForm
                      initialData={formData.basicInfo}
                      onSubmit={(data, isValid) => {
                        updateFormData(1, data);
                        updateFormValidity(1, isValid);
                      }}
                      hideButtons={true}
                    />
                  </TabsContent>
                  
                  <TabsContent value="detailed">
                    <DetailedInfoForm
                      initialData={formData.detailedInfo}
                      onSubmit={(data, isValid) => {
                        updateFormData(2, data);
                        updateFormValidity(2, isValid);
                      }}
                      onBack={() => {}}
                      hideButtons={true}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/dashboard/startups/${startupId}`)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            <Button 
              onClick={() => handleSubmit(formData)}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isSubmitting ? <LoadingIndicator size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 