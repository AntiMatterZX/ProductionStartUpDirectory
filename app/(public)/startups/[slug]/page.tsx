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
  
  const [startup, setStartup] = useState<Startup | null>(null)
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

        // 2. Fetch social links
        const { data: socialLinksData } = await supabase
          .from("social_links")
          .select("*")
          .eq("startup_id", startup.id);

        // 3. Fetch media
        const { data: mediaData } = await supabase
          .from("startup_media")
          .select("*")
          .eq("startup_id", startup.id);

        // 4. Fetch looking_for options
        const { data: lookingForData } = await supabase
          .from("startup_looking_for")
          .select("looking_for_options(id, name)")
          .eq("startup_id", startup.id);

        // 5. Fetch vote count
        const { data: votesData } = await supabase
          .from("votes")
          .select("vote")
          .eq("startup_id", startup.id);

        // Calculate upvotes and downvotes
        const upvotes = votesData?.filter((vote) => vote.vote).length || 0;
        const downvotes = votesData?.filter((vote) => !vote.vote).length || 0;

        // Combine all data
        setStartup({
          ...startup,
          categories: categoryData || null,
          social_links: socialLinksData || [],
          startup_media: mediaData || [],
          looking_for: lookingForData?.map((item) => item.looking_for_options) || [],
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

  // Get cover image from media
  const coverImage = startup.startup_media?.find((media) => media.is_featured && media.media_type === "image")?.url;

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
              media={startup.startup_media}
              videoUrl={startup.startup_media?.find((m) => m.media_type === "video")?.url}
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
