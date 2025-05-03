"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase/client-component"
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

export default function StartupDetailPage({ params }: { params: { id: string } }) {
  const startupId = params.id;
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [startup, setStartup] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [lookingForOptions, setLookingForOptions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    console.log("Fetching startup data...");
    fetchData();
  }, [startupId]);

  // Fetch data from database
  async function fetchData() {
    try {
      console.log("Starting fetchData...");
      setIsLoading(true);

      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No session found, redirecting to login");
        router.push("/login?redirect=/dashboard/startups/" + startupId);
        return;
      }

      console.log("User is authenticated, fetching startup data");
      // Fetch startup with all fields including the looking_for array
      const startupResult = await supabase
        .from("startups")
        .select(`
          *,
          categories(*)
        `)
        .eq("id", startupId)
        .single();
      
      if (startupResult.error || !startupResult.data) {
        console.error("Error fetching startup:", startupResult.error);
        router.push("/dashboard/startups");
        return;
      }

      const startupData = startupResult.data;
      console.log("Startup data fetched successfully:", startupData);
      console.log("Looking for options directly from startups table:", startupData.looking_for || []);
      
      // Check if the user owns this startup
      const isOwner = startupData.user_id === session.user.id;

      if (!isOwner) {
        console.log("User doesn't own this startup, redirecting");
        router.push("/dashboard/startups");
        return;
      }
      
      console.log("User is the owner, fetching additional data");
      
      // Fetch categories and looking_for options
      const [categoriesResult, optionsResult] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("looking_for_options").select("id, name").order("name")
      ]);
      
      // Set data
      setStartup(startupData);
      console.log("Startup state set");
      
      if (categoriesResult.data) {
        setCategories(categoriesResult.data);
        console.log("Categories set:", categoriesResult.data.length);
      }
      
      if (optionsResult.data) {
        setLookingForOptions(optionsResult.data);
        console.log("Looking for options set:", optionsResult.data.length);
      }
      
      // Get social links directly from the startup object
      const socialLinks = {
        linkedin: startupData.linkedin_url || "",
        twitter: startupData.twitter_url || ""
      };
      
      console.log("Social links from startup object:", socialLinks);
      
      // Get looking_for options directly from the startups table
      const lookingFor = Array.isArray(startupData.looking_for) ? 
        startupData.looking_for.map((id: number) => Number(id)) : [];
      
      console.log("Looking for options from startup object:", lookingFor);
      
      // Convert founding date to YYYY-MM-DD format
      let formattedFoundingDate = "";
      if (startupData.founding_date) {
        const date = new Date(startupData.founding_date);
        formattedFoundingDate = date.toISOString().split('T')[0];
      }
      
      console.log("Setting form state with data");
      // Initialize form state with startup data
      setFormState({
        name: startupData.name || "",
        tagline: startupData.tagline || "",
        description: startupData.description || "",
        category_id: startupData.category_id || 0,
        location: startupData.location || "",
        founding_date: formattedFoundingDate,
        employee_count: startupData.employee_count?.toString() || "",
        funding_stage: startupData.funding_stage || "",
        funding_amount: startupData.funding_amount?.toString() || "",
        website_url: startupData.website_url || "",
        looking_for: lookingFor,
        social_links: socialLinks
      });
      console.log("Form state initialized with social links:", socialLinks);
      console.log("Form state initialized with looking_for:", lookingFor);
      
    } catch (error) {
      console.error("Error in fetchData:", error);
      toast({
        title: "Error",
        description: "Failed to load startup data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log("Fetch data complete");
    }
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

  // Loading state
  if (isLoading || !startup) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-muted-foreground">Loading startup details...</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/startups">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Startups
            </Button>
          </Link>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input 
                value={formState.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="text-2xl font-bold py-1 h-auto"
                placeholder="Startup Name"
              />
            </div>
          ) : (
          <h1 className="text-3xl font-bold">{startup.name}</h1>
          )}
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsEditing(true)}>
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Startup
          </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>This action cannot be undone. This will permanently delete your startup
                    "{startup.name}" and all associated data.</p>
                    <p className="font-semibold">Please type the name of your startup to confirm deletion:</p>
                    <Input 
                      id="startup-name-confirmation" 
                      placeholder="Enter startup name"
                      onKeyUp={(e) => {
                        const input = e.currentTarget as HTMLInputElement;
                        const deleteBtn = document.getElementById('confirm-delete-btn') as HTMLButtonElement;
                        if (deleteBtn) {
                          deleteBtn.disabled = input.value !== startup.name;
                        }
                      }}
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    id="confirm-delete-btn"
                    onClick={handleDelete}
                    disabled={true}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete Startup"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                Status: <span className="capitalize">{startup.status}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-shrink-0 w-32 h-32 bg-muted rounded-md overflow-hidden relative group">
                  {startup.logo_url ? (
                    <img 
                      src={startup.logo_url} 
                      alt={`${startup.name} logo`} 
                      className="w-full h-full object-contain p-2" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <StartupLogoUpload
                        startupId={startupId}
                        currentLogoUrl={startup.logo_url}
                        buttonText="Change Logo"
                        className="bg-white text-black hover:bg-white/90"
                        onUploaded={(url) => {
                          // Refresh the page to show the updated logo
                          window.location.reload();
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <>
                      <div className="mb-4">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                          id="tagline"
                          value={formState.tagline}
                          onChange={(e) => handleChange("tagline", e.target.value)}
                          placeholder="A short, catchy description"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="category">Industry</Label>
                          <Select
                            value={formState.category_id?.toString()}
                            onValueChange={(value) => handleChange("category_id", Number(value))}
                          >
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Select industry" />
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
                        
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={formState.location}
                            onChange={(e) => handleChange("location", e.target.value)}
                            placeholder="e.g. New York, USA"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formState.description}
                          onChange={(e) => handleChange("description", e.target.value)}
                          placeholder="Describe your startup"
                          className="min-h-[100px]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold">{startup.name}</h2>
                        <div className="mt-2 mb-4">
                          <h3 className="text-sm font-medium text-muted-foreground">Tagline</h3>
                          <p className="text-base mt-1">{startup.tagline || `${startup.name} - Innovative solutions`}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Industry</h3>
                          <p className="text-base">{startup.categories?.name || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                          <p className="text-base">{startup.location || "Not specified"}</p>
                        </div>
                      </div>
                      
                <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                        <p className="text-sm mt-1">{startup.description || "No description provided"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="funding-stage">Funding Stage</Label>
                      <Select
                        value={formState.funding_stage}
                        onValueChange={(value) => handleChange("funding_stage", value)}
                      >
                        <SelectTrigger id="funding-stage">
                          <SelectValue placeholder="Select funding stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pre-seed">Pre-seed</SelectItem>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="series-a">Series A</SelectItem>
                          <SelectItem value="series-b">Series B</SelectItem>
                          <SelectItem value="series-c">Series C</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="funding-amount">Funding Amount ($)</Label>
                      <Input
                        id="funding-amount"
                        type="number"
                        value={formState.funding_amount}
                        onChange={(e) => handleChange("funding_amount", e.target.value)}
                        placeholder="e.g. 100000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="team-size">Team Size</Label>
                      <Input
                        id="team-size"
                        type="number"
                        value={formState.employee_count}
                        onChange={(e) => handleChange("employee_count", e.target.value)}
                        placeholder="Number of employees"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="founding-date">Founded Date</Label>
                      <Input
                        id="founding-date"
                        type="date"
                        value={formState.founding_date}
                        onChange={(e) => handleChange("founding_date", e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Funding Stage</h3>
                      <p className="text-base">{startup.funding_stage ? startup.funding_stage.charAt(0).toUpperCase() + startup.funding_stage.slice(1).replace(/-/g, ' ') : "Not specified"}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Funding Amount</h3>
                      <p className="text-base">{startup.funding_amount ? `$${Number(startup.funding_amount).toLocaleString()}` : "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Team Size</h3>
                      <p className="text-base">{startup.employee_count ? `${startup.employee_count} people` : "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Founded</h3>
                      <p className="text-base">{startup.founding_date ? new Date(startup.founding_date).toLocaleDateString() : "Not specified"}</p>
                    </div>
                </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Looking For</h3>
                  
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {lookingForOptions.map((option) => {
                        const isSelected = formState.looking_for.includes(option.id);
                        return (
                          <Button
                            key={option.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleLookingForOption(option.id)}
                            className={`rounded-full ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            {option.name}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(startup.looking_for) && startup.looking_for.length > 0 ? (
                        startup.looking_for.map((optionId: number) => {
                          // Find the option name from the lookingForOptions array
                          const option = lookingForOptions.find(opt => opt.id === optionId);
                          return (
                            <span 
                              key={optionId} 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {option?.name || `Option ${optionId}`}
                            </span>
                          );
                        })
                      ) : (
                        <p>Not specified</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                        <LinkIcon className="h-4 w-4" />
                      </span>
                      <Input
                        id="website"
                        value={formState.website_url}
                        onChange={(e) => handleChange("website_url", e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Social Media</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                          LinkedIn
                        </span>
                        <Input
                          value={formState.social_links.linkedin || ""}
                          onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                          placeholder="LinkedIn URL"
                          className="rounded-l-none"
                        />
                      </div>
                      
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                          Twitter
                        </span>
                        <Input
                          value={formState.social_links.twitter || ""}
                          onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                          placeholder="Twitter URL"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                    {startup.website_url ? (
                      <div className="flex mt-1">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                          <LinkIcon className="h-4 w-4" />
                        </span>
                        <a 
                          href={startup.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex-1 inline-flex px-3 py-2 border border-input rounded-r-md text-primary hover:underline"
                        >
                    {startup.website_url}
                  </a>
                </div>
                    ) : (
                      <p className="text-muted-foreground mt-1">No website provided</p>
              )}
                  </div>
              
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Social Media</h3>
                    <div className="space-y-2 mt-1">
                      {/* Display LinkedIn if available */}
                      {startup.linkedin_url && (
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                            LinkedIn
                          </span>
                          <a 
                            href={startup.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex px-3 py-2 border border-input rounded-r-md text-primary hover:underline"
                          >
                            {startup.linkedin_url}
                          </a>
                        </div>
                      )}
                      
                      {/* Display Twitter if available */}
                      {startup.twitter_url && (
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground">
                            Twitter
                          </span>
                          <a 
                            href={startup.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                            className="flex-1 inline-flex px-3 py-2 border border-input rounded-r-md text-primary hover:underline"
                          >
                            {startup.twitter_url}
                          </a>
                        </div>
                      )}
                      
                      {/* Show message if no social links */}
                      {!startup.linkedin_url && !startup.twitter_url && (
                        <p className="text-muted-foreground">No social links provided</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <StartupMediaDisplay 
                startupId={startupId}
                mediaImages={startup.media_images || []}
                mediaDocuments={startup.media_documents || []}
                mediaVideos={startup.media_videos || []}
                isEditing={isEditing}
                onMediaRemoved={(mediaType, url) => {
                  // Refresh the page to show updated media
                  window.location.reload();
                }}
                onMediaAdded={(mediaType, url) => {
                  // Refresh the page to show updated media
                  window.location.reload();
                }}
              />
            </CardContent>
            
            {isEditing && (
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/startups/${startupId}/edit`}>
                    <Upload className="mr-2 h-4 w-4" />
                    Go to Full Edit Page for Media Upload
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 