import { Suspense, use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, PencilIcon } from "lucide-react"

export default async function StartupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise with React.use() for Next.js 15
  const unwrappedParams = use(params);
  const startupId = unwrappedParams.id;
  
  const supabase = await createServerComponentClient()

  // Get the current user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // This should be handled by middleware
  }

  // Fetch the startup
  const { data: startup, error } = await supabase
    .from("startups")
    .select(`
      *,
      categories(id, name),
      startup_looking_for(option_id, looking_for_options(id, name)),
      social_links(id, platform, url),
      startup_media(id, media_type, url, title, description, is_featured)
    `)
    .eq("id", startupId)
    .single()

  if (error || !startup) {
    console.error("Error fetching startup:", error)
    notFound()
  }

  // Check if the user owns this startup
  const isOwner = startup.user_id === session.user.id

  if (!isOwner) {
    // If not the owner, redirect or handle accordingly
    // For now, we'll just not found it
    notFound()
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
          <h1 className="text-3xl font-bold">{startup.name}</h1>
        </div>
        
        <Link href={`/dashboard/startups/${startupId}/edit`}>
          <Button>
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Startup
          </Button>
        </Link>
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
                <div className="flex-shrink-0 w-32 h-32 bg-muted rounded-md overflow-hidden">
                  {startup.logo_url ? (
                    <img 
                      src={startup.logo_url} 
                      alt={`${startup.name} logo`} 
                      className="w-full h-full object-contain" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      No Logo
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">{startup.name}</h2>
                  <div className="text-sm text-muted-foreground mb-2">
                    {startup.categories?.name && (
                      <span className="mr-4">Industry: {startup.categories.name}</span>
                    )}
                    {startup.location && (
                      <span>Location: {startup.location}</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{startup.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Funding Stage</h3>
                  <p>{startup.funding_stage || "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Team Size</h3>
                  <p>{startup.employee_count ? `${startup.employee_count} people` : "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Founded</h3>
                  <p>{startup.founding_date ? new Date(startup.founding_date).toLocaleDateString() : "Not specified"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Looking For</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {startup.startup_looking_for?.length > 0 ? (
                      startup.startup_looking_for.map((item: any) => (
                        <span key={item.option_id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {item.looking_for_options?.name}
                        </span>
                      ))
                    ) : (
                      <p>Not specified</p>
                    )}
                  </div>
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
              {startup.website_url && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                  <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {startup.website_url}
                  </a>
                </div>
              )}
              
              {startup.social_links && startup.social_links.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Social Media</h3>
                  <div className="space-y-2">
                    {startup.social_links.map((link: any) => (
                      <a 
                        key={link.id} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-primary hover:underline"
                      >
                        {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                      </a>
                    ))}
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
              <Suspense fallback={<div>Loading media...</div>}>
                {startup.startup_media && startup.startup_media.length > 0 ? (
                  <div className="space-y-4">
                    {startup.startup_media.filter((media: any) => media.media_type === 'image').map((media: any) => (
                      <div key={media.id} className="overflow-hidden rounded-md">
                        <img 
                          src={media.url} 
                          alt={media.title || "Startup media"} 
                          className="w-full h-auto object-cover"
                        />
                        {media.title && (
                          <p className="mt-2 text-sm font-medium">{media.title}</p>
                        )}
                      </div>
                    ))}
                    
                    {startup.startup_media.filter((media: any) => media.media_type === 'document').map((media: any) => (
                      <div key={media.id}>
                        <a 
                          href={media.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {media.title || "View Document"}
                        </a>
                      </div>
                    ))}
                    
                    {startup.startup_media.filter((media: any) => media.media_type === 'video').map((media: any) => (
                      <div key={media.id}>
                        <a 
                          href={media.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {media.title || "Watch Video"}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No media available</p>
                )}
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 