"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, BookmarkIcon, ShieldIcon, SearchIcon } from "lucide-react"
import { MotionDiv } from "@/components/ui/motion"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { ArrowRight, FilePlus, BarChart, Rocket, Users } from "lucide-react"
import { Session } from "@supabase/supabase-js"

// Define types for our data
type ProfileType = {
  full_name?: string;
  created_at?: string;
  roles?: {
    name?: string;
  };
  profile_completion?: number;
  [key: string]: any;
}

type StartupType = {
  id: string;
  name: string;
  created_at: string;
  status: string;
  [key: string]: any;
}

type ActivityType = {
  name: string;
  status: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Client-side state management with proper types
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [startupCount, setStartupCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [startups, setStartups] = useState<StartupType[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityType[]>([])
  const [investorViews, setInvestorViews] = useState({ total: 0, percentChange: 0 })

  useEffect(() => {
    async function fetchData() {
      try {
        // Get session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        setSession(session)

        // Get user profile and role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, roles(name)")
          .eq("id", session.user.id)
          .single()

        setProfile(profileData)

        // Calculate profile completion score
        const profileCompletionScore = calculateProfileCompletionScore(profileData);
        
        // Update profile data with completion score
        if (profileData) {
          profileData.profile_completion = profileCompletionScore;
          setProfile(profileData);
          
          // Optionally update the score in the database if it's not already there
          if (profileData.profile_completion !== profileCompletionScore) {
            await supabase
              .from('profiles')
              .update({ profile_completion: profileCompletionScore })
              .eq('id', session.user.id);
          }
        }

        // Fetch startups
        const { data: startupsData } = await supabase
          .from("startups")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(4)
          
        setStartups(startupsData || [])
        
        // Fetch latest activity
        const { data: activity } = await supabase
          .from("startups")
          .select("name, status, updated_at")
          .eq("user_id", session.user.id)
          .order("updated_at", { ascending: false })
          .limit(3)
          
        setRecentActivity(activity || [])

        // Get user's startups count
        const { count: startupsCount } = await supabase
          .from("startups")
          .select("*", { count: "exact", head: true })
          .eq("user_id", session.user.id)

        setStartupCount(startupsCount || 0)

        // Get user's wishlist count if investor
        if (profileData?.roles?.name === "investor" || profileData?.roles?.name === "admin") {
          const { count: wishlist } = await supabase
            .from("wishlist")
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id)

          setWishlistCount(wishlist || 0)
        }
        
        // Fetch investor views data
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        try {
          // Fetch current month views
          const { data: currentMonthViews, error: currentError } = await supabase
            .from('startup_views')
            .select('count')
            .gte('viewed_at', startOfCurrentMonth.toISOString())
            .eq('startup_user_id', session.user.id);
            
          // Fetch previous month views  
          const { data: previousMonthViews, error: prevError } = await supabase
            .from('startup_views')
            .select('count')
            .gte('viewed_at', startOfPreviousMonth.toISOString())
            .lt('viewed_at', endOfPreviousMonth.toISOString())
            .eq('startup_user_id', session.user.id);
          
          if (currentError || prevError) {
            console.error("Error fetching startup views:", currentError || prevError);
            setInvestorViews({
              total: 0,
              percentChange: 0
            });
          } else {
            // Calculate totals and percent change
            const currentTotal = currentMonthViews?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
            const previousTotal = previousMonthViews?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
            
            let percentChange = 0;
            if (previousTotal > 0) {
              percentChange = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
            }
            
            setInvestorViews({
              total: currentTotal,
              percentChange: percentChange
            });
          }
        } catch (viewsError) {
          console.error("Exception in startup views fetch:", viewsError);
          setInvestorViews({
            total: 0,
            percentChange: 0
          });
        }
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])
  
  // Function to calculate profile completion score
  function calculateProfileCompletionScore(profileData: ProfileType | null): number {
    if (!profileData) return 0;
    
    const fields = [
      'full_name',
      'avatar_url',
      'bio',
      'location',
      'website',
      'company',
      'job_title'
    ];
    
    const completedFields = fields.filter(field => 
      profileData[field] !== null && 
      profileData[field] !== undefined && 
      profileData[field] !== ''
    );
    
    return Math.round((completedFields.length / fields.length) * 100);
  }

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const userRole = profile?.roles?.name || "user"

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.full_name || "User"}</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your startups today.
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/dashboard/startups/create">
            <FilePlus className="mr-2 h-4 w-4" /> Create Startup
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Startups
            </CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{startups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total ventures created
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/startups" className="text-xs text-primary hover:underline inline-flex items-center">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investor Views
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investorViews.total}</div>
            <p className="text-xs text-muted-foreground">
              {investorViews.percentChange > 0 ? '+' : ''}{investorViews.percentChange}% from last month
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/analytics" className="text-xs text-primary hover:underline inline-flex items-center">
              View analytics <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.profile_completion || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Profile completion score
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/profile" className="text-xs text-primary hover:underline inline-flex items-center">
              Complete profile <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Member Since
            </CardTitle>
            <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="size-2 rounded-full bg-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.created_at ? formatDate(new Date(profile.created_at)) : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Account creation date
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 hover-lift">
          <CardHeader>
            <CardTitle>Recent Startups</CardTitle>
            <CardDescription>
              Your latest ventures and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {startups && startups.length > 0 ? (
              <div className="space-y-6">
                {startups.map((startup) => (
                  <div key={startup.id} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Rocket className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{startup.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(new Date(startup.created_at))}
                        </p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors 
                      ${startup.status === "approved" ? "border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300" :
                      startup.status === "rejected" ? "border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300" :
                      "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}
                    `}>
                      {startup.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-lg font-semibold">No startups yet</h3>
                <p className="mb-4 text-sm text-muted-foreground max-w-md">
                  You haven't created any startups yet. Get started by creating your first venture.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/startups/create">
                    <PlusIcon className="mr-2 h-4 w-4" /> Create Your First Startup
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 hover-lift">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button variant="outline" asChild className="h-12 justify-start">
                  <Link href="/dashboard/startups/create">
                    <PlusIcon className="mr-2 h-5 w-5 text-primary" />
                    <span>Create New Startup</span>
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="h-12 justify-start">
                  <Link href="/startups">
                    <SearchIcon className="mr-2 h-5 w-5 text-primary" />
                    <span>Browse Startups</span>
                  </Link>
                </Button>
                
                {(userRole === "investor" || userRole === "admin") && (
                  <Button variant="outline" asChild className="h-12 justify-start">
                    <Link href="/dashboard/investor/wishlist">
                      <BookmarkIcon className="mr-2 h-5 w-5 text-primary" />
                      <span>View Wishlist</span>
                    </Link>
                  </Button>
                )}
                
                {userRole === "admin" && (
                  <Button variant="outline" asChild className="h-12 justify-start">
                    <Link href="/admin">
                      <ShieldIcon className="mr-2 h-5 w-5 text-primary" />
                      <span>Admin Panel</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
