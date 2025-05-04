"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowLeft, PencilIcon, Save, X, Check, Upload, Link as LinkIcon, Trash2, Undo, ArrowLeftCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Database } from "@/types/database"
import StartupMediaDisplay from "@/app/components/StartupMediaDisplay"
import StartupLogoUpload from "@/app/components/StartupLogoUpload"
import StartupMediaUpload from "@/app/components/StartupMediaUpload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Pencil, PlusCircle, Image, FileText, Link2, Loader2 } from "lucide-react"

export default function StartupDetailPage({ params }: { params: { id: string } }) {
  const startupId = params.id;
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  // State variables
  const [loading, setLoading] = useState(true);
  const [startup, setStartup] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [lookingForOptions, setLookingForOptions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [mediaItems, setMediaItems] = useState({
    images: [] as string[],
    documents: [] as string[],
    videos: [] as string[]
  });
  
  // Simple form state
  const [formState, setFormState] = useState({
    name: "",
    tagline: "",
    description: "",
    category_id: 0,
    location: "",
    founding_date: "",
    employee_count: "",
    funding_stage: "",
    funding_amount: "",
    website_url: "",
    looking_for: [] as number[],
    social_links: {
      linkedin: "",
      twitter: ""
    }
  });

  // Generate a simple UUID for client-side use
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Fetch startup data
  useEffect(() => {
    async function fetchStartupData() {
      try {
        setLoading(true);
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please log in to view your startup",
            variant: "destructive",
          });
          router.push("/login?redirect=/dashboard/startups");
          return;
        }
        
        setUserId(session.user.id);
        
        // Fetch the startup data
        const { data, error } = await supabase
          .from("startups")
          .select(`
            *,
            categories(id, name),
            startup_looking_for(option_id, looking_for_options(id, name)),
            social_links(id, platform, url)
          `)
          .eq("id", startupId)
          .single();
        
        if (error || !data) {
          throw new Error("Startup not found");
        }
        
        // Check if the user owns this startup
        if (data.user_id !== session.user.id) {
          toast({
            title: "Access denied",
            description: "You don't have permission to view this startup",
            variant: "destructive",
          });
          router.push("/dashboard/startups");
          return;
        }
        
        setStartup(data);
        
        // Extract media items
        setMediaItems({
          images: data.media_images || [],
          documents: data.media_documents || [],
          videos: data.media_videos || []
        });
        
      } catch (error: any) {
        console.error("Error fetching startup:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load startup data",
          variant: "destructive",
        });
        router.push("/dashboard/startups");
      } finally {
        setLoading(false);
      }
    }
    
    fetchStartupData();
  }, [startupId, supabase, router]);

  // Handle logo update
  const handleLogoUpdated = (url: string) => {
    setStartup((prev: any) => ({
      ...prev,
      logo_url: url
    }));
    
    toast({
      title: "Logo updated",
      description: "Your startup logo has been updated"
    });
  };
  
  // Handle media upload
  const handleMediaUploaded = (url: string, type: string) => {
    if (type === "image" || type === "coverImage") {
      setMediaItems((prev) => ({
        ...prev,
        images: [...prev.images, url]
      }))
    } else if (type === "document" || type === "pitch_deck" || type === "pitchDeck") {
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
      description: `Your ${type} has been uploaded successfully`
    })
  }

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle social links changes
  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };

  // Toggle looking for options
  const toggleLookingForOption = (optionId: number) => {
    console.log(`Toggling looking for option: ${optionId}`);
    console.log(`Current looking_for options:`, formState.looking_for);
    
    setFormState(prev => {
      const currentOptions = [...prev.looking_for];
      const index = currentOptions.indexOf(optionId);
      
      if (index === -1) {
        // Add option
        console.log(`Adding option ${optionId}`);
        return {
          ...prev,
          looking_for: [...currentOptions, optionId]
        };
      } else {
        // Remove option
        console.log(`Removing option ${optionId}`);
        currentOptions.splice(index, 1);
        return {
          ...prev,
          looking_for: currentOptions
        };
      }
    });
  };

  // Handle form submission
  const handleSave = async () => {
    try {
      console.log("Starting save process...");
      setIsSaving(true);
      
      // Validate required fields
      if (!formState.name || !formState.description) {
        toast({
          title: "Validation Error",
          description: "Name and description are required",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      // Log the form state for debugging
      console.log("Current form state:", JSON.stringify(formState, null, 2));

      // Create update object with only fields that exist in the database
      const updateObj: {
        name: string;
        description: string;
        website_url: string;
        founding_date: string | null;
        employee_count: number | null;
        funding_stage: string | null;
        funding_amount: number | null;
        location: string | null;
        category_id: number | null;
        updated_at: string;
        tagline?: string | null;
        linkedin_url?: string | null;
        twitter_url?: string | null;
        looking_for: number[];
      } = {
        name: formState.name,
        description: formState.description,
        website_url: formState.website_url,
        founding_date: formState.founding_date || null,
        employee_count: formState.employee_count ? parseInt(formState.employee_count) : null,
        funding_stage: formState.funding_stage || null,
        funding_amount: formState.funding_amount ? parseFloat(formState.funding_amount) : null,
        location: formState.location || null,
        category_id: formState.category_id || null,
        updated_at: new Date().toISOString(),
        // Add social links directly to the startup object
        linkedin_url: formState.social_links.linkedin || null,
        twitter_url: formState.social_links.twitter || null,
        // Add looking_for array directly to the startup
        looking_for: formState.looking_for
      };

      // Add tagline to update if it's available
      try {
        const { data: schemaData } = await supabase
          .from('startups')
          .select('tagline')
          .limit(1);
        
        if (schemaData && schemaData.length > 0 && 'tagline' in schemaData[0]) {
          console.log("Tagline column exists in schema, adding to update");
          updateObj.tagline = formState.tagline || null;
        } else {
          console.log("Tagline column not found in schema, skipping");
        }
      } catch (e) {
        console.log("Error checking schema for tagline column:", e);
      }

      // Update startup with all data including looking_for array
      console.log("Updating startup with data:", updateObj);
      
      const { error: updateError } = await supabase
        .from("startups")
        .update(updateObj)
        .eq("id", startupId);
      
      if (updateError) {
        console.error("Error updating startup:", updateError);
        throw new Error(`Failed to update startup: ${updateError.message}`);
      }

      console.log("Update completed successfully!");
      toast({
        title: "Success!",
        description: "Your startup has been updated successfully",
      });
      
      // Force a reload to ensure everything is freshly loaded
      console.log("Refreshing page to show updated data...");
      window.location.href = `/dashboard/startups/${startupId}?t=${Date.now()}`;
      
    } catch (error: any) {
      console.error("Error in handleSave:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem updating your startup",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle startup deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from("startups")
        .delete()
        .eq("id", startupId);
      
      if (error) {
        throw new Error(`Error deleting startup: ${error.message}`);
      }
      
      toast({
        title: "Success!",
        description: "Your startup has been deleted successfully",
      });
      
      // Redirect to startups list
      router.push("/dashboard/startups");
      
    } catch (error: any) {
      console.error("Error deleting startup:", error);
      toast({
        title: "Error",
        description: error.message || "There was a problem deleting your startup",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!startup) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="py-10 text-center">
            <h3 className="text-lg font-medium">Startup not found</h3>
            <p className="text-muted-foreground mt-2">The startup you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/startups">Go Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{startup.name}</h1>
            <p className="text-muted-foreground mt-1">{startup.tagline || "No tagline provided"}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/startups/${startup.slug}`} target="_blank">
                View Public Page
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/startups/${startupId}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Startup
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Upload and manage your startup's media assets</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="logo">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="logo">Logo & Images</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="links">Videos & Links</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="logo" className="space-y-6">
                    {/* Logo section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Company Logo</h3>
                        {userId && (
                          <StartupLogoUpload 
                            startupId={startupId}
                            userId={userId}
                            currentLogoUrl={startup.logo_url} 
                            onUploaded={handleLogoUpdated}
                          />
                        )}
                      </div>
                      
                      <div className="flex justify-center p-8 border-2 border-dashed rounded-lg">
                        {startup.logo_url ? (
                          <img 
                            src={startup.logo_url}
                            alt={`${startup.name} logo`}
                            className="max-h-48 object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Image className="h-12 w-12 mb-2" />
                            <p>No logo uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Images section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Images</h3>
                        {userId && (
                          <StartupMediaUpload 
                            startupId={startupId}
                            userId={userId}
                            mediaType="image"
                            onUploaded={(url) => handleMediaUploaded(url, "image")}
                            buttonLabel="Upload Image"
                          />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {mediaItems.images.length > 0 ? (
                          mediaItems.images.map((url, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden">
                              <img 
                                src={url}
                                alt={`Startup image ${index + 1}`}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 flex justify-center p-8 border-2 border-dashed rounded-lg">
                            <div className="flex flex-col items-center text-muted-foreground">
                              <Image className="h-12 w-12 mb-2" />
                              <p>No images uploaded yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="documents" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Documents</h3>
                      {userId && (
                        <StartupMediaUpload 
                          startupId={startupId}
                          userId={userId}
                          mediaType="document"
                          onUploaded={(url) => handleMediaUploaded(url, "document")}
                          buttonLabel="Upload Document"
                        />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {mediaItems.documents.length > 0 ? (
                        mediaItems.documents.map((url, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span className="text-sm">Document {index + 1}</span>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link href={url} target="_blank">View</Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-center p-8 border-2 border-dashed rounded-lg">
                          <div className="flex flex-col items-center text-muted-foreground">
                            <FileText className="h-12 w-12 mb-2" />
                            <p>No documents uploaded yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Pitch Deck</h3>
                      {userId && (
                        <StartupMediaUpload 
                          startupId={startupId}
                          userId={userId}
                          mediaType="pitch_deck"
                          onUploaded={(url) => handleMediaUploaded(url, "pitch_deck")}
                          buttonLabel="Upload Pitch Deck"
                        />
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="links" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Videos</h3>
                      {userId && (
                        <StartupMediaUpload 
                          startupId={startupId}
                          userId={userId}
                          mediaType="video"
                          onUploaded={(url) => handleMediaUploaded(url, "video")}
                          buttonLabel="Upload Video"
                        />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {mediaItems.videos.length > 0 ? (
                        mediaItems.videos.map((url, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center">
                              <Link2 className="h-5 w-5 mr-2 text-muted-foreground" />
                              <span className="text-sm">{url.substring(0, 50)}...</span>
                            </div>
                            <Button asChild size="sm" variant="outline">
                              <Link href={url} target="_blank">View</Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-center p-8 border-2 border-dashed rounded-lg">
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Link2 className="h-12 w-12 mb-2" />
                            <p>No videos uploaded yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Social Links</h3>
                      <div className="space-y-3">
                        {startup.social_links && startup.social_links.length > 0 ? (
                          startup.social_links.map((link: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center">
                                <Link2 className="h-5 w-5 mr-2 text-muted-foreground" />
                                <span className="text-sm capitalize">{link.platform}: {link.url.substring(0, 30)}...</span>
                              </div>
                              <Button asChild size="sm" variant="outline">
                                <Link href={link.url} target="_blank">View</Link>
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4 text-muted-foreground">
                            No social links added yet. Edit your startup to add social links.
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Startup Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <p>{startup.categories?.name || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="whitespace-pre-wrap">{startup.description || "No description provided"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                  <p>{startup.location || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Founded</h3>
                  <p>{startup.founding_date ? new Date(startup.founding_date).toLocaleDateString() : "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Team Size</h3>
                  <p>{startup.employee_count || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Funding Stage</h3>
                  <p>{startup.funding_stage || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                  <p>
                    {startup.website_url ? (
                      <Link href={startup.website_url} target="_blank" className="text-primary hover:underline">
                        {startup.website_url}
                      </Link>
                    ) : "Not specified"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Looking For</CardTitle>
              </CardHeader>
              <CardContent>
                {startup.startup_looking_for && startup.startup_looking_for.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {startup.startup_looking_for.map((item: any, index: number) => (
                      <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors">
                        {item.looking_for_options?.name || "Unknown"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-2">No options selected</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 