"use client"

import Link from "next/link"
import { RocketIcon, BookOpenText, Layers, Code, PanelRight, Lightbulb, Shield, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DocsPage() {
  return (
    <div className="container max-w-5xl py-12 md:py-16 space-y-12">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
          LaunchPad Documentation
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Your comprehensive guide to using LaunchPad to connect startups with investors and resources
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="getting-started" className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Welcome to LaunchPad</h2>
            <p>
              LaunchPad is a comprehensive platform designed to connect startups with investors
              and essential resources they need to grow. This guide will help you get started
              with using our platform efficiently.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <RocketIcon className="h-5 w-5 text-primary" />
                    For Startups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Create an account and verify your email</li>
                    <li>Complete your profile with your startup details</li>
                    <li>Add your pitch, product information, and team</li>
                    <li>Connect with potential investors</li>
                  </ol>
                  <Button className="mt-4 w-full">
                    <Link href="/signup?action=create-startup">Create Startup Profile</Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    For Investors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Create an account and verify your identity</li>
                    <li>Complete your investor profile</li>
                    <li>Browse startups based on your interests</li>
                    <li>Connect with promising startups</li>
                  </ol>
                  <Button className="mt-4 w-full">
                    <Link href="/signup?role=investor">Create Investor Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PanelRight className="h-5 w-5 text-primary" />
                  Dashboard
                </CardTitle>
                <CardDescription>
                  Comprehensive dashboard for managing your profile and connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>The LaunchPad dashboard provides a central hub to manage your startup or investor profile, track connections, and access platform features.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenText className="h-5 w-5 text-primary" />
                  Startup Profiles
                </CardTitle>
                <CardDescription>
                  Rich profiles for showcasing your startup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Create detailed profiles with information about your team, product, market, financials, and pitch materials to attract the right investors.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Investor Matching
                </CardTitle>
                <CardDescription>
                  Smart algorithms to connect with the right investors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Our matching system pairs startups with investors based on industry, investment stage, funding needs, and other relevant criteria.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Secure Communication
                </CardTitle>
                <CardDescription>
                  Private and secure messaging system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Exchange messages, documents, and information with potential investors or startups through our secure communication channels.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Integrate with the LaunchPad API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                LaunchPad offers a comprehensive API for developers looking to build integrations.
                Our API documentation is available through Swagger/OpenAPI.
              </p>
              <div className="flex flex-col md:flex-row gap-4 py-4">
                <Button className="flex items-center gap-2">
                  <Link href="/docs/api" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span>View API Docs</span>
                  </Link>
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Link href="/api/swagger" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>Download OpenAPI Spec</span>
                  </Link>
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-md overflow-auto">
                <pre className="text-sm">
                  <code>{`// Example API Request
fetch('https://launchpad.io/api/startups', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="faqs" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">How do I create a startup profile?</h3>
                <p className="text-muted-foreground">
                  Register for an account, verify your email, then navigate to the dashboard and click on "Create Startup" to fill out your startup profile.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Is LaunchPad free to use?</h3>
                <p className="text-muted-foreground">
                  LaunchPad offers a free tier with basic features. Premium features are available through paid subscriptions that unlock additional benefits.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">How does investor matching work?</h3>
                <p className="text-muted-foreground">
                  Our algorithm analyzes your startup profile and matches you with investors who have shown interest in your industry, stage, and funding requirements.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Can I control who sees my startup information?</h3>
                <p className="text-muted-foreground">
                  Yes, LaunchPad provides privacy controls that allow you to choose what information is public and what requires permission to access.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">How can I get support if I have issues?</h3>
                <p className="text-muted-foreground">
                  Contact our support team through the help center or email support@launchpad.io for assistance with any platform-related questions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 