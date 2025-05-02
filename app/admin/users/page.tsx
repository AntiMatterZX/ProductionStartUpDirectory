import { createServerComponentClient } from "@/lib/supabase/server-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default async function AdminUsersPage() {
  // Get the Supabase client
  const supabase = await createServerComponentClient()

  // Fetch all users
  const { data: users } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      created_at,
      updated_at,
      avatar_url,
      roles(name)
    `)
    .order("created_at", { ascending: false })

  // Get user stats
  const totalUsers = users?.length || 0
  
  // Safely check admin status
  const getRoleName = (user: any) => {
    try {
      if (!user.roles) return null
      
      // Direct object with name property
      if (typeof user.roles === 'object' && !Array.isArray(user.roles) && user.roles.name) {
        return user.roles.name
      }
      
      // Array of objects with name property
      if (Array.isArray(user.roles) && user.roles.length > 0 && user.roles[0].name) {
        return user.roles[0].name
      }
      
      return null
    } catch (error) {
      return null
    }
  }
  
  const adminUsers = users?.filter(user => getRoleName(user) === "admin").length || 0
  
  const newUsersThisWeek = users?.filter(user => {
    const createdDate = new Date(user.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return createdDate > weekAgo;
  }).length || 0

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{adminUsers}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">New This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{newUsersThisWeek}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Last Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {users && users.length > 0 
                ? new Date(users[0].created_at).toLocaleDateString() 
                : "No users"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts in the platform
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 w-full md:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">User</th>
                  <th className="h-10 px-4 text-left font-medium">Email</th>
                  <th className="h-10 px-4 text-left font-medium">Role</th>
                  <th className="h-10 px-4 text-left font-medium">Joined</th>
                  <th className="h-10 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} alt={user.full_name} />
                            <AvatarFallback>
                              {user.full_name?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">{user.email}</td>
                      <td className="p-4 align-middle">
                        {getRoleName(user) === "admin" ? (
                          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">
                            User
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 