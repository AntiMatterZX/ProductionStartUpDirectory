"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import StartupHeader from "@/components/startup/detail/StartupHeader"
import StartupDescription from "@/components/startup/detail/StartupDescription"
import StartupMedia from "@/components/startup/detail/StartupMedia"
import StartupSidebar from "@/components/startup/detail/StartupSidebar"
import StartupActions from "@/components/startup/detail/StartupActions"
import { MotionDiv } from "@/components/ui/motion"
import { generateSlug } from "@/lib/utils/helpers/slug-generator"
import type { Startup } from "@/types/startup"

export default function StartupDetailPage({ params }: { params: { slug: string } }) {
  const slugValue = params.slug;
  
  const [startup, setStartup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)
  const [userInfo, setUserInfo] = useState<{ id: string | null }>({ id: null })
  const supabase = createClientComponentClient()

  // First fetch authenticated user info - use getUser() as recommended for security
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUserInfo({ id: user?.id || null })
      } catch (error) {
        console.error("Error fetching user:", error)
        setUserInfo({ id: null })
      }
    }
    
    fetchUserInfo()
  }, [supabase])
  
  // Then fetch startup data
  useEffect(() => {
    async function fetchStartup() {
      try {
        console.log(`Fetching startup with slug: ${slugValue}`);
        const validatedSlug = generateSlug(slugValue);
        console.log(`Validated slug: ${validatedSlug}`);
        
        // First, try to find the startup by slug
        let { data: startupData, error: startupError } = await supabase
          .from("startups")
          .select("*")
          .eq("slug", validatedSlug)
          .limit(1);

        // If not found by slug, try by ID
        if (!startupData || startupData.length === 0) {
          console.log("Startup not found by slug, trying by ID...");
          const { data: idData, error: idError } = await supabase
            .from("startups")
            .select("*")
            .eq("id", slugValue)
            .limit(1);
            
          if (idData && idData.length > 0) {
            startupData = idData;
            startupError = idError;
          }
        }
        
        // If still not found, return 404
        if (!startupData || startupData.length === 0) {
          console.error("Startup not found with slug or ID:", slugValue);
          setNotFoundError(true);
          return;
        }

        const startup = startupData[0];
        console.log(`Found startup: ${startup.name} (${startup.id})`);

        // Fetch additional data separately to avoid relationship issues
        // 1. Fetch category data
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("id", startup.category_id)
          .single();

        // 2. Fetch social links separately with error handling
        try {
          const { data: socialLinksData, error: socialLinksError } = await supabase
            .from("social_links")
            .select("platform, url")
            .eq("startup_id", startup.id);
          
          if (socialLinksError) {
            console.warn("Error fetching social links (table may not exist):", socialLinksError);
            startup.social_links = [];
          } else {
            startup.social_links = socialLinksData || [];
          }
        } catch (socialException) {
          console.warn("Exception fetching social links:", socialException);
          startup.social_links = [];
        }

        // 3. Instead of fetching from startup_media table, create media objects from arrays
        const startup_media = [];

        // Add logo to media if exists
        if (startup.logo_url) {
          startup_media.push({
            id: `logo-${Math.random().toString(36).substr(2, 9)}`,
            startup_id: startup.id,
            url: startup.logo_url,
            media_type: "image",
            title: "Logo",
            is_featured: true,
            created_at: new Date().toISOString()
          });
        }

        // Add images
        if (startup.media_images && Array.isArray(startup.media_images)) {
          startup.media_images.forEach((url: string) => {
            startup_media.push({
              id: `img-${Math.random().toString(36).substr(2, 9)}`,
              startup_id: startup.id,
              url: url,
              media_type: "image",
              title: "Image",
              is_featured: false,
              created_at: new Date().toISOString()
            });
          });
        }

        // Add documents
        if (startup.media_documents && Array.isArray(startup.media_documents)) {
          startup.media_documents.forEach((url: string) => {
            startup_media.push({
              id: `doc-${Math.random().toString(36).substr(2, 9)}`,
              startup_id: startup.id,
              url: url,
              media_type: "document",
              title: "Document",
              is_featured: false,
              created_at: new Date().toISOString()
            });
          });
        }

        // Add videos
        if (startup.media_videos && Array.isArray(startup.media_videos)) {
          startup.media_videos.forEach((url: string) => {
            startup_media.push({
              id: `vid-${Math.random().toString(36).substr(2, 9)}`,
              startup_id: startup.id,
              url: url,
              media_type: "video",
              title: "Video",
              is_featured: false,
              created_at: new Date().toISOString()
            });
          });
        }

        // Log media for debugging
        console.log("Created media objects:", {
          count: startup_media.length,
          logo: startup.logo_url,
          images: startup.media_images?.length || 0,
          docs: startup.media_documents?.length || 0,
          videos: startup.media_videos?.length || 0
        });

        // 4. Fetch looking_for options - Updated for new schema
        const { data: lookingForOptions } = await supabase
          .from("looking_for_options")
          .select("id, name")
          .in("id", startup.looking_for || []);

        // 5. Fetch vote count
        const { data: votesData } = await supabase
          .from("votes")
          .select("vote")
          .eq("startup_id", startup.id);

        // Calculate upvotes and downvotes
        const upvotes = votesData?.filter((vote) => vote.vote).length || 0;
        const downvotes = votesData?.filter((vote) => !vote.vote).length || 0;

        // Combine all data
        console.log("Processed startup data:", {
          id: startup.id,
          name: startup.name,
          socialLinks: startup.social_links || [],
          lookingFor: lookingForOptions || []
        });

        setStartup({
          ...startup,
          categories: categoryData || null,
          social_links: startup.social_links || [],
          startup_media: startup_media,
          looking_for: lookingForOptions || [],
          votes: {
            upvotes,
            downvotes,
          },
        } as unknown as Startup);
      } catch (error) {
        console.error("Error fetching startup:", error);
        setNotFoundError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchStartup();
  }, [supabase, slugValue]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notFoundError || !startup) {
    return notFound();
  }

  // Only show approved startups to the public
  if (startup.status !== "approved") {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">This startup is not yet approved</h1>
        <p className="text-muted-foreground mb-8">
          This startup is currently under review and will be visible once approved by our team.
        </p>
      </div>
    );
  }

  // Get cover image - use the first media image or the logo
  const coverImage = startup.media_images && startup.media_images.length > 0 
    ? startup.media_images[0] 
    : startup.logo_url;

  return (
    <div className="min-h-screen bg-background">
      <StartupHeader
        name={startup.name}
        logo={startup.logo_url}
        coverImage={coverImage}
        category={startup.categories?.name}
        foundingYear={startup.founding_date ? new Date(startup.founding_date).getFullYear() : undefined}
        location={startup.location}
      />

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <MotionDiv
            className="lg:col-span-2 space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StartupActions startup={startup} userId={userInfo.id} />
            <StartupDescription description={startup.description} />
            <StartupMedia
              media={startup.startup_media as any[]}
              videoUrl={startup.startup_media?.find((m: any) => m.media_type === "video")?.url}
            />
          </MotionDiv>

          <MotionDiv
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StartupSidebar
              website={startup.website_url}
              fundingStage={startup.funding_stage}
              fundingAmount={startup.funding_amount}
              teamSize={startup.employee_count}
              lookingFor={startup.looking_for}
              socialLinks={startup.social_links}
            />
          </MotionDiv>
        </div>
      </div>
    </div>
  );
}
