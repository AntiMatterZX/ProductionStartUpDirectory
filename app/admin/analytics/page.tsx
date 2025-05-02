"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { FiTrendingUp, FiUsers, FiBarChart2, FiClock } from "react-icons/fi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStartups: 0,
    approvalRate: 0,
    newUsersThisMonth: 0,
    avgApprovalTime: 0
  })
  
  const [timeRange, setTimeRange] = useState("week")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      const supabase = createClientComponentClient()
      
      try {
        // Get total users
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          
        // Get total startups
        const { count: startupCount } = await supabase
          .from('startups')
          .select('*', { count: 'exact', head: true })
        
        // Get approved startups
        const { count: approvedCount } = await supabase
          .from('startups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
        
        // Get users from this month
        const dateThreshold = new Date()
        dateThreshold.setMonth(dateThreshold.getMonth() - 1)
        
        const { count: newUserCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateThreshold.toISOString())
        
        setStats({
          totalUsers: userCount || 0,
          totalStartups: startupCount || 0,
          approvalRate: startupCount ? Math.round(((approvedCount || 0) / startupCount) * 100) : 0,
          newUsersThisMonth: newUserCount || 0,
          avgApprovalTime: 3.2 // Placeholder value in days
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [])

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        
        <Select defaultValue={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last 90 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticCard 
          title="Total Users"
          value={stats.totalUsers.toString()}
          description="Registered accounts"
          icon={<FiUsers className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <AnalyticCard 
          title="Total Startups"
          value={stats.totalStartups.toString()}
          description="Submitted profiles"
          icon={<FiBarChart2 className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <AnalyticCard 
          title="Approval Rate"
          value={`${stats.approvalRate}%`}
          description="Startups approved"
          icon={<FiTrendingUp className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <AnalyticCard 
          title="Avg. Time to Approve"
          value={`${stats.avgApprovalTime} days`}
          description="Response time"
          icon={<FiClock className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <Tabs defaultValue="traffic" className="mt-8">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="startups">Startup Submissions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Views</CardTitle>
              <CardDescription>
                Track visitor behavior across your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Analytics data visualization</p>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-indigo-100 dark:bg-indigo-950/30 rounded-t-md"
                      style={{ 
                        height: `${Math.max(20, Math.floor(Math.random() * 200))}px`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2">Page</th>
                      <th className="text-right pb-2">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { page: "Homepage", views: 4290 },
                      { page: "Startups", views: 3821 },
                      { page: "Dashboard", views: 2473 },
                      { page: "Login", views: 1258 },
                      { page: "Register", views: 983 }
                    ].map((item) => (
                      <tr key={item.page} className="border-b">
                        <td className="py-2">{item.page}</td>
                        <td className="text-right py-2">{item.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where visitors come from</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                {[
                  { source: "Direct", percentage: 45 },
                  { source: "Organic Search", percentage: 30 },
                  { source: "Referral", percentage: 15 },
                  { source: "Social Media", percentage: 10 }
                ].map((item) => (
                  <div key={item.source} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{item.source}</span>
                      <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>
                Track new user registrations over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center w-full">
                <p className="text-muted-foreground mb-6">New user registrations by month</p>
                <div className="grid grid-cols-12 gap-2 items-end">
                  {[28, 42, 36, 55, 63, 47, 72, 85, 92, 105, 123, 140].map((value, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div 
                        className="bg-indigo-600 rounded-t-md w-full"
                        style={{ height: `${value * 2}px` }}
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-muted/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium">Total Growth</h3>
                    <p className="text-2xl font-bold mt-1">+123%</p>
                    <p className="text-xs text-muted-foreground mt-1">Compared to previous year</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <h3 className="text-sm font-medium">Retention Rate</h3>
                    <p className="text-2xl font-bold mt-1">68%</p>
                    <p className="text-xs text-muted-foreground mt-1">Users active after 30 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="startups">
          <Card>
            <CardHeader>
              <CardTitle>Startup Activity</CardTitle>
              <CardDescription>
                Track startup submissions and approvals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-medium mb-4">Submissions by Category</h3>
                  <div className="space-y-4">
                    {[
                      { category: "Technology", count: 45 },
                      { category: "Finance", count: 24 },
                      { category: "Healthcare", count: 18 },
                      { category: "Education", count: 15 },
                      { category: "Entertainment", count: 12 }
                    ].map((item) => (
                      <div key={item.category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{item.category}</span>
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${(item.count / 45) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Approval Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Approved</p>
                      <p className="text-xl font-bold mt-1">78%</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Rejected</p>
                      <p className="text-xl font-bold mt-1">18%</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-xl font-bold mt-1">4%</p>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-2">Recent Startups</h3>
                  <div className="space-y-2">
                    {[
                      { name: "TechFlow Solutions", status: "approved", date: "2 days ago" },
                      { name: "HealthSync", status: "approved", date: "3 days ago" },
                      { name: "EduMetrics", status: "rejected", date: "5 days ago" }
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm">{item.name}</span>
                        <div className="flex items-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === "approved" 
                              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Platform Engagement</CardTitle>
              <CardDescription>
                User interaction metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center size-24 rounded-full border-8 border-indigo-100 dark:border-indigo-950/40">
                      <span className="text-3xl font-bold">4.2m</span>
                    </div>
                    <h3 className="font-medium mt-2">Total Page Views</h3>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="text-sm font-medium">Active Users</h3>
                      <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">
                        +12%
                      </span>
                    </div>
                    <p className="text-2xl font-bold">4,892</p>
                    <p className="text-xs text-muted-foreground mt-1">Monthly active users</p>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="font-medium mb-4">User Actions</h3>
                  <div className="space-y-4">
                    {[
                      { action: "Profile Views", count: 12480, percentage: 100 },
                      { action: "Message Sent", count: 8954, percentage: 71 },
                      { action: "Connection Requests", count: 5621, percentage: 45 },
                      { action: "Files Downloaded", count: 3845, percentage: 30 },
                      { action: "Comments Posted", count: 2156, percentage: 17 }
                    ].map((item) => (
                      <div key={item.action}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{item.action}</span>
                          <span className="text-sm text-muted-foreground">{item.count.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h3 className="text-sm font-medium">Avg. Session Duration</h3>
                      <p className="text-2xl font-bold mt-1">8m 24s</p>
                      <p className="text-xs text-green-600 mt-1">+1m 12s from last month</p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h3 className="text-sm font-medium">Pages Per Session</h3>
                      <p className="text-2xl font-bold mt-1">5.4</p>
                      <p className="text-xs text-green-600 mt-1">+0.8 from last month</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface AnalyticCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  isLoading: boolean;
}

function AnalyticCard({ title, value, description, icon, isLoading }: AnalyticCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 bg-muted/60 rounded animate-pulse"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
} 