import { createServerComponentClient } from "@/lib/supabase/server-component"
import Link from "next/link"
import { Suspense } from "react"
import LoadingIndicator from "@/components/ui/loading-indicator"

export default async function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  // Get the Supabase client
  const supabase = await createServerComponentClient()

  // Fetch counts for dashboard cards
  const { data: pendingStartups, error: pendingError } = await supabase
    .from("startups")
    .select("id", { count: "exact" })
    .eq("status", "pending")
  
  const pendingCount = pendingError ? 0 : pendingStartups?.length || 0
  
  // Fetch user count
  const { count: userCount, error: userError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
  
  // Fetch new registrations this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const { count: newUserCount, error: newUserError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneWeekAgo.toISOString())
  
  // Fetch recent activity
  const { data: recentActivity, error: activityError } = await supabase
    .from("startups")
    .select(`
      id,
      name,
      slug,
      status,
      created_at,
      updated_at,
      profiles(full_name, email)
    `)
    .in("status", ["approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(5)

  const formatActivity = (startup: any) => {
    const action = startup.status === "approved" ? "Startup approved" : "Startup rejected"
    const time = formatTimeAgo(new Date(startup.updated_at))
    return {
      action,
      target: startup.name,
      time
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard 
          title="Pending Startups" 
          count={pendingCount} 
          description="Startups waiting for approval"
          link="/admin/moderation" 
        />
        <DashboardCard 
          title="Total Users" 
          count={userCount || 0} 
          description="Registered users"
          link="/admin/users" 
        />
        <DashboardCard 
          title="This Week" 
          count={newUserCount || 0} 
          description="New registrations"
          link="/admin/analytics" 
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg border p-4">
          {recentActivity && recentActivity.length > 0 ? (
            <ul className="divide-y">
              {recentActivity.map((startup) => {
                const { action, target, time } = formatActivity(startup)
                return (
                  <ActivityItem 
                    key={startup.id}
                    action={action} 
                    target={target} 
                    time={time} 
                  />
                )
              })}
            </ul>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6 h-40 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3 mb-6"></div>
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-center">
        <LoadingIndicator size="lg" />
      </div>
    </div>
  )
}

function DashboardCard({ title, count, description, link }: { 
  title: string; 
  count: number; 
  description: string; 
  link: string;
}) {
  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{count}</p>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
      <Link 
        href={link} 
        className="inline-block mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
      >
        View Details →
      </Link>
    </div>
  )
}

function ActivityItem({ action, target, time }: { 
  action: string; 
  target: string; 
  time: string;
}) {
  return (
    <li className="py-3 flex justify-between">
      <div>
        <span className="font-medium">{action}</span>
        <span className="text-gray-500"> - {target}</span>
      </div>
      <span className="text-gray-400 text-sm">{time}</span>
    </li>
  )
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return diffInDays === 1 ? 'Yesterday' : `${diffInDays} days ago`
  }
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return date.toLocaleDateString(undefined, options)
} 