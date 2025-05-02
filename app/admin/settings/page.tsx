"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = () => {
    setIsSaving(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully."
      })
    }, 1500)
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">User Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>
                  Configure general settings for your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    defaultValue="VentureConnect"
                    placeholder="Enter site name"
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea
                    id="site-description"
                    placeholder="Enter site description"
                    defaultValue="Connect startups with investors and resources"
                    className="min-h-24"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      defaultValue="admin@ventureconnect.com"
                      placeholder="Enter contact email"
                    />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      defaultValue="support@ventureconnect.com"
                      placeholder="Enter support email"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="feat-startup-submissions">Startup Submissions</Label>
                  <Switch id="feat-startup-submissions" defaultChecked />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="feat-user-messaging">User Messaging</Label>
                  <Switch id="feat-user-messaging" defaultChecked />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="feat-connections">User Connections</Label>
                  <Switch id="feat-connections" defaultChecked />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="feat-public-profiles">Public Profiles</Label>
                  <Switch id="feat-public-profiles" defaultChecked />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="feat-analytics">Analytics Tracking</Label>
                  <Switch id="feat-analytics" defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system and email notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Admin Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="notify-new-startup">New Startup Submissions</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a new startup is submitted
                      </p>
                    </div>
                    <Switch id="notify-new-startup" defaultChecked />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="notify-new-user">New User Registrations</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when a new user registers
                      </p>
                    </div>
                    <Switch id="notify-new-user" defaultChecked />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="notify-reports">User Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when content is reported
                      </p>
                    </div>
                    <Switch id="notify-reports" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Email Templates</h3>
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Label htmlFor="welcome-email">Welcome Email Template</Label>
                    <Textarea
                      id="welcome-email"
                      placeholder="Enter welcome email template"
                      defaultValue="Welcome to VentureConnect! We're excited to have you join our platform..."
                      className="min-h-24"
                    />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="approval-email">Startup Approval Email</Label>
                    <Textarea
                      id="approval-email"
                      placeholder="Enter approval email template"
                      defaultValue="Congratulations! Your startup has been approved on VentureConnect..."
                      className="min-h-24"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-md p-4">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Email templates use placeholders like {'{name}'} and {'{date}'} that will be replaced with actual values when sent.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" className="mr-2">Reset to Default</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
              <CardDescription>
                Configure user-related settings and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Registration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="allow-signups">Allow New Signups</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable user registrations
                      </p>
                    </div>
                    <Switch id="allow-signups" defaultChecked />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="email-verification">Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify email before accessing the platform
                      </p>
                    </div>
                    <Switch id="email-verification" defaultChecked />
                  </div>
                  <Separator />
                  
                  <div className="grid gap-3">
                    <Label htmlFor="default-role">Default User Role</Label>
                    <Select defaultValue="user">
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="startup">Startup Owner</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Authentication</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="google-auth">Google Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to sign in with Google
                      </p>
                    </div>
                    <Switch id="google-auth" defaultChecked />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="github-auth">GitHub Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to sign in with GitHub
                      </p>
                    </div>
                    <Switch id="github-auth" defaultChecked />
                  </div>
                  <Separator />
                  
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="password-auth">Email/Password Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to sign in with email and password
                      </p>
                    </div>
                    <Switch id="password-auth" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Maintenance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="maintenance-mode" className="text-red-600 dark:text-red-400">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Put the site in maintenance mode (only admins can access)
                      </p>
                    </div>
                    <Switch id="maintenance-mode" />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="maintenance-message">Maintenance Message</Label>
                    <Textarea
                      id="maintenance-message"
                      placeholder="Enter maintenance message"
                      defaultValue="We're currently performing scheduled maintenance. Please check back soon."
                      className="min-h-24"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Caching</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div>
                      <Label htmlFor="enable-cache">Enable Caching</Label>
                      <p className="text-sm text-muted-foreground">
                        Cache static content for better performance
                      </p>
                    </div>
                    <Switch id="enable-cache" defaultChecked />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="cache-duration">Cache Duration (minutes)</Label>
                    <Input
                      id="cache-duration"
                      type="number"
                      defaultValue="60"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Database Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline">Export Database</Button>
                  <Button variant="outline" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                    Clear Cache
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 