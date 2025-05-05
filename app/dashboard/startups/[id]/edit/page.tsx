"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftCircle, Loader2, PencilIcon, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Database } from "@/types/database"
import StartupMediaDisplay from "@/app/components/StartupMediaDisplay"

export default function EditStartupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [startupData, setStartupData] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [lookingForOptions, setLookingForOptions] = useState<any[]>([])
  const [mediaItems, setMediaItems] = useState({
    images: [] as string[],
    documents: [] as string[],
    videos: [] as string[]
  })
  
  // Form data for different steps
  const [formData, setFormData] = useState({
    basicInfo: {},
    detailedInfo: {},
    mediaInfo: {}
  })
  
  // Form validation state
  const [formValidity, setFormValidity] = useState({
    step1: false,
    step2: false,
    step3: false
  })
  
  // Social links state
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [loadingSocial, setLoadingSocial] = useState(false)
  
  // Fetch startup data
  useEffect(() => {
    const fetchStartupData = async () => {
      try {
        setIsLoading(true)
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please log in to edit your startup",
            variant: "destructive"
          })
          router.push("/login?redirect=/dashboard/startups")
          return
        }
        
        // Fetch startup data
        const { data: startup, error } = await supabase
          .from("startups")
          .select(`
            *,
            categories(id, name)
          `)
          .eq("id", params.id)
          .single()
        
        if (error) {
          console.error("Error fetching startup:", error)
          throw new Error(error.message)
        }
        
        if (!startup) {
          toast({
            title: "Startup not found",
            description: "The startup you're trying to edit doesn't exist or has been deleted",
            variant: "destructive"
          })
          router.push("/dashboard/startups")
          return
        }
        
        // Check if user owns this startup
        if (startup.user_id !== session.user.id) {
          toast({
            title: "Access denied",
            description: "You don't have permission to edit this startup",
            variant: "destructive"
          })
          router.push("/dashboard/startups")
          return
        }
        
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("*")
          .order("name")
        
        if (categoriesData) {
          setCategories(categoriesData)
        }
        
        // Fetch looking for options
        const { data: lookingForOptionsData } = await supabase
          .from("looking_for_options")
          .select("*")
          .order("name")
        
        if (lookingForOptionsData) {
          setLookingForOptions(lookingForOptionsData)
        }
        
        // Set startup data
        setStartupData(startup)
        
        // Initialize media items
        setMediaItems({
          images: startup.media_images || [],
          documents: startup.media_documents || [],
          videos: startup.media_videos || []
        })
        
        // Fetch social links
        await fetchSocialLinks()
        
        console.log("Startup data loaded successfully:", startup.name)
        
      } catch (error: any) {
        console.error("Error fetching startup for editing:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load startup data",
          variant: "destructive"
        })
        router.push("/dashboard/startups")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStartupData()
  }, [params.id, router, supabase])
  
  // Handle media deletion via the MediaDeleteButton component
  const handleMediaRemoved = (mediaType: string, url: string) => {
    switch (mediaType) {
      case "logo":
        setStartupData((prev: any) => ({
          ...prev,
          logo_url: null
        }))
        break
      case "banner":
        setStartupData((prev: any) => ({
          ...prev,
          banner_url: null
        }))
        break
      case "gallery":
      case "image":
        setMediaItems((prev) => ({
          ...prev,
          images: prev.images.filter(item => item !== url)
        }))
        break
      case "document":
      case "pitch_deck":
        if (startupData?.pitch_deck_url === url) {
          setStartupData((prev: any) => ({
            ...prev,
            pitch_deck_url: null
          }))
        }
        setMediaItems((prev) => ({
          ...prev,
          documents: prev.documents.filter(item => item !== url)
        }))
        break
      case "video":
        setMediaItems((prev) => ({
          ...prev,
          videos: prev.videos.filter(item => item !== url)
        }))
        break
    }
    
    toast({
      title: "Media removed",
      description: `The ${mediaType} has been deleted successfully.`
    })
  }
  
  // Handle media uploads
  const handleMediaUploaded = (url: string, type: string) => {
    if (type === "logo") {
      setStartupData((prev: any) => ({
        ...prev,
        logo_url: url
      }))
    } else if (type === "banner") {
      setStartupData((prev: any) => ({
        ...prev,
        banner_url: url
      }))
    } else if (type === "image" || type === "gallery") {
      setMediaItems((prev) => ({
        ...prev,
        images: [...prev.images, url]
      }))
    } else if (type === "document" || type === "pitch_deck") {
      if (type === "pitch_deck") {
        setStartupData((prev: any) => ({
          ...prev,
          pitch_deck_url: url
        }))
      }
      setMediaItems((prev) => ({
        ...prev,
        documents: [...prev.documents, url]
      }))
    } else if (type === "video") {
      setMediaItems((prev) => ({
        ...prev,
        videos: [...prev.videos, url]
      }))
    }
    
    toast({
      title: "Media uploaded",
      description: `Your ${type.replace('_', ' ')} has been uploaded successfully`
    })
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
  
  // Handle save - update startup in the database
  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Prepare update data
      const updateData = {
        ...startupData,
        media_images: mediaItems.images,
        media_documents: mediaItems.documents,
        media_videos: mediaItems.videos,
        updated_at: new Date().toISOString()
      }
      
      // Remove any fields that shouldn't be sent
      delete updateData.categories
      delete updateData.created_at
      
      // Update startup in the database
      const { error } = await supabase
        .from("startups")
        .update(updateData)
        .eq("id", params.id)
      
      if (error) {
        throw new Error(`Error updating startup: ${error.message}`)
      }
      
      toast({
        title: "Success",
        description: "Your startup has been updated successfully"
      })
      
      // Redirect to startup detail page
      router.push(`/dashboard/startups/${params.id}`)
      
    } catch (error: any) {
      console.error("Error updating startup:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update startup",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Fetch social links
  const fetchSocialLinks = async () => {
    try {
      setLoadingSocial(true)
      
      const { data: socialLinksData, error: socialError } = await supabase
        .from("social_links")
        .select("id, platform, url")
        .eq("startup_id", params.id)
      
      if (socialError) {
        console.error("Error fetching social links:", socialError)
        setSocialLinks({})
        return
      }
      
      // Convert the array to an object for easier editing
      const socialLinksObj: Record<string, string> = {}
      if (socialLinksData && socialLinksData.length > 0) {
        socialLinksData.forEach(link => {
          socialLinksObj[link.platform] = link.url
        })
      }
      
      setSocialLinks(socialLinksObj)
    } catch (error) {
      console.error("Error fetching social links:", error)
      setSocialLinks({})
    } finally {
      setLoadingSocial(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-4 px-4 h-[calc(100vh-2rem)] flex flex-col">
      {/* Header with back button and save */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/startups/${params.id}`}>
              <ArrowLeftCircle className="h-4 w-4 mr-2" />
              Back to Startup
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit {startupData?.name}</h1>
        </div>
        
        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
      
      {/* Main content */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Basic Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="additional">Additional Info</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-hidden">
          <TabsContent value="details" className="h-full mt-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Basic Details</CardTitle>
                <CardDescription>Edit your startup's basic information</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto pr-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Startup Name</Label>
                    <Input
                      id="name"
                      value={startupData?.name || ""}
                      onChange={(e) => setStartupData({ ...startupData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={startupData?.tagline || ""}
                      onChange={(e) => setStartupData({ ...startupData, tagline: e.target.value })}
                      placeholder="A short, catchy description of your startup"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={startupData?.description || ""}
                      onChange={(e) => setStartupData({ ...startupData, description: e.target.value })}
                      rows={5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={startupData?.category_id?.toString() || ""}
                      onValueChange={(value) => setStartupData({ ...startupData, category_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="media" className="h-full mt-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Media Assets</CardTitle>
                <CardDescription>
                  Manage your startup's logo, images, documents, and videos
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto pr-6">
                <StartupMediaDisplay
                  startupId={params.id}
                  mediaImages={mediaItems.images}
                  mediaDocuments={mediaItems.documents}
                  mediaVideos={mediaItems.videos}
                  logoImage={startupData?.logo_image}
                  bannerImage={startupData?.banner_image}
                  isEditing={true}
                  onMediaRemoved={handleMediaRemoved}
                  onMediaAdded={(url, type) => handleMediaUploaded(url, type)}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="additional" className="h-full mt-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>More details about your startup</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto pr-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={startupData?.website_url || ""}
                      onChange={(e) => setStartupData({ ...startupData, website_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={startupData?.location || ""}
                      onChange={(e) => setStartupData({ ...startupData, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input
                      id="linkedin"
                      value={startupData?.linkedin_url || ""}
                      onChange={(e) => setStartupData({ ...startupData, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter URL</Label>
                    <Input
                      id="twitter"
                      value={startupData?.twitter_url || ""}
                      onChange={(e) => setStartupData({ ...startupData, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="founding-date">Founding Date</Label>
                    <Input
                      id="founding-date"
                      type="date"
                      value={startupData?.founding_date ? startupData.founding_date.substring(0, 10) : ""}
                      onChange={(e) => setStartupData({ ...startupData, founding_date: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="team-size">Team Size</Label>
                    <Input
                      id="team-size"
                      type="number"
                      min="1"
                      value={startupData?.employee_count || ""}
                      onChange={(e) => setStartupData({ ...startupData, employee_count: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>What are you looking for?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {lookingForOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`looking-for-${option.id}`}
                          checked={startupData?.looking_for?.includes(option.id) || false}
                          onChange={(e) => {
                            const currentOptions = [...(startupData?.looking_for || [])];
                            if (e.target.checked) {
                              // Add option
                              setStartupData({
                                ...startupData,
                                looking_for: [...currentOptions, option.id]
                              });
                            } else {
                              // Remove option
                              setStartupData({
                                ...startupData,
                                looking_for: currentOptions.filter(id => id !== option.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`looking-for-${option.id}`}>{option.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 