"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { 
  CheckCircle2, XCircle, AlertTriangle, Eye, Shield, Filter,
  RefreshCw, MoreHorizontal, AlertCircle, Search, ShieldAlert, User, Calendar, Clock, ExternalLink
} from "lucide-react"
import LoadingIndicator from "@/components/ui/loading-indicator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function SpamModerationPage() {
  const [loading, setLoading] = useState(true)
  const [startups, setStartups] = useState<any[]>([])
  const [spamStartups, setSpamStartups] = useState<any[]>([])
  const [potentialSpam, setPotentialSpam] = useState<any[]>([])
  const [selectedStartup, setSelectedStartup] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isActionPending, setIsActionPending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Fetch all startups on load
  useEffect(() => {
    fetchAllStartups()
  }, [])

  // Filter startups based on search query
  const filteredStartups = startups.filter(startup => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (startup.name?.toLowerCase().includes(query)) ||
      (startup.description?.toLowerCase().includes(query)) ||
      (startup.slug?.toLowerCase().includes(query))
    )
  })

  // Detect potential spam based on simple rules
  const detectPotentialSpam = (startupData: any[]) => {
    const spamIndicators = [
      // URL patterns
      { pattern: /(https?:\/\/|www\.)\S+/g, threshold: 3, field: 'description', type: 'excessive_urls' },
      // Repetitive text
      { pattern: /(.{15,})\1{2,}/g, field: 'description', type: 'repetitive_content' },
      // Random characters/gibberish
      { pattern: /[a-z]{15,}/g, field: 'description', type: 'random_characters' },
      // Repetitive startup name (same word repeated)
      { pattern: /(\b\w+\b)(\s+\1){2,}/g, field: 'name', type: 'repetitive_name' }
    ]

    const spam: any[] = []
    const potentialSpam: any[] = []

    startupData.forEach(startup => {
      let spamScore = 0
      const reasons: string[] = []

      // Simple checks
      if (startup.name && startup.name.length > 50) {
        spamScore += 1
        reasons.push('Excessively long name')
      }

      if (startup.description && startup.description.length < 10) {
        spamScore += 1
        reasons.push('Description too short')
      }

      // Advanced pattern matching
      spamIndicators.forEach(indicator => {
        const fieldValue = startup[indicator.field]
        if (fieldValue) {
          const matches = fieldValue.match(indicator.pattern)
          if (matches) {
            const threshold = indicator.threshold || 1
            if (matches.length >= threshold) {
              spamScore += 2
              reasons.push(`Detected ${indicator.type} in ${indicator.field}`)
            }
          }
        }
      })

      // Categorize based on spam score
      if (spamScore >= 3) {
        startup.spamScore = spamScore
        startup.spamReasons = reasons
        spam.push(startup)
      } else if (spamScore > 0) {
        startup.spamScore = spamScore
        startup.spamReasons = reasons
        potentialSpam.push(startup)
      }
    })

    return { spam, potentialSpam }
  }

  // Fetch all startups
  async function fetchAllStartups() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from("startups")
        .select(`
          id,
          name,
          slug,
          description,
          tagline,
          status,
          created_at,
          updated_at,
          user_id,
          logo_url,
          profiles(full_name, email)
        `)
        .order("created_at", { ascending: false })
      
      if (error) {
        throw error
      }
      
      const startupData = data || []
      setStartups(startupData)
      
      // Detect spam content
      const { spam, potentialSpam } = detectPotentialSpam(startupData)
      setSpamStartups(spam)
      setPotentialSpam(potentialSpam)
      
    } catch (err) {
      console.error("Error fetching startups:", err)
      toast({
        title: "Error",
        description: "Failed to load startups. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle approval/rejection/spam flagging
  async function handleAction(id: string, action: 'approve' | 'reject' | 'flag' | 'delete') {
    try {
      setIsActionPending(true)
      
      if (action === 'delete') {
        const { error } = await supabase
          .from("startups")
          .delete()
          .eq("id", id)

        if (error) throw error

        setStartups(startups.filter(s => s.id !== id))
        setSpamStartups(spamStartups.filter(s => s.id !== id))
        setPotentialSpam(potentialSpam.filter(s => s.id !== id))
        
        toast({
          title: "Startup deleted",
          description: "The startup has been permanently deleted",
        })
        return
      }
      
      const statusMap = {
        approve: "approved",
        reject: "rejected",
        flag: "flagged_spam"
      }
      
      const { error } = await supabase
        .from("startups")
        .update({ 
          status: statusMap[action],
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
      
      if (error) throw error
      
      // Update local state
      const updatedStartups = startups.map(s => {
        if (s.id === id) {
          return { ...s, status: statusMap[action] }
        }
        return s
      })
      
      setStartups(updatedStartups)
      setSpamStartups(spamStartups.filter(s => s.id !== id))
      setPotentialSpam(potentialSpam.filter(s => s.id !== id))
      
      toast({
        title: action === 'approve' 
          ? "Startup approved" 
          : action === 'reject' 
          ? "Startup rejected" 
          : "Startup flagged as spam",
        description: action === 'approve' 
          ? "The startup has been approved and is now public" 
          : action === 'reject'
          ? "The startup has been rejected"
          : "The startup has been flagged as spam",
        variant: action === 'approve' ? "default" : "destructive",
      })
      
    } catch (err) {
      console.error("Error updating startup:", err)
      toast({
        title: "Action failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsActionPending(false)
    }
  }

  // Bulk actions on multiple startups
  async function handleBulkAction(startupIds: string[], action: 'approve' | 'reject' | 'flag' | 'delete') {
    try {
      setIsActionPending(true)
      let successCount = 0;
      
      for (const id of startupIds) {
        if (action === 'delete') {
          const { error } = await supabase
            .from("startups")
            .delete()
            .eq("id", id)
  
          if (!error) successCount++;
        } else {
          const statusMap = {
            approve: "approved",
            reject: "rejected",
            flag: "flagged_spam"
          }
          
          const { error } = await supabase
            .from("startups")
            .update({ 
              status: statusMap[action],
              updated_at: new Date().toISOString()
            })
            .eq("id", id)
          
          if (!error) successCount++;
        }
      }
      
      // Refresh data
      await fetchAllStartups();
      
      toast({
        title: "Bulk action completed",
        description: `Successfully processed ${successCount} of ${startupIds.length} startups`,
      })
      
    } catch (err) {
      console.error("Error with bulk action:", err)
      toast({
        title: "Bulk action failed",
        description: "There was an error processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsActionPending(false)
    }
  }

  // Preview startup details
  function handlePreview(startup: any) {
    setSelectedStartup(startup)
    setPreviewOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Spam Management</h1>
          <p className="text-muted-foreground">
            Detect and handle spam or low-quality startup submissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAllStartups}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/moderation">
              Main Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search startups by name or content..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="detected" className="space-y-4">
        <TabsList>
          <TabsTrigger value="detected" className="flex gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Detected Spam ({spamStartups.length})</span>
          </TabsTrigger>
          <TabsTrigger value="potential" className="flex gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Potential Spam ({potentialSpam.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex gap-2">
            <Filter className="h-4 w-4" />
            <span>All Submissions ({filteredStartups.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detected">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    Detected Spam ({spamStartups.length})
                  </CardTitle>
                  <CardDescription>
                    Submissions that have been automatically detected as spam
                  </CardDescription>
                </div>
                {spamStartups.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleBulkAction(spamStartups.map(s => s.id), 'flag')}
                    disabled={isActionPending}
                  >
                    Flag All as Spam
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingIndicator size="lg" />
                </div>
              ) : spamStartups.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-lg">
                  <p className="text-muted-foreground">No spam detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {spamStartups.map((startup) => (
                    <SpamCard 
                      key={startup.id}
                      startup={startup}
                      onPreview={() => handlePreview(startup)}
                      onDelete={() => handleAction(startup.id, 'delete')}
                      onFlag={() => handleAction(startup.id, 'flag')}
                      onReject={() => handleAction(startup.id, 'reject')}
                      onApprove={() => handleAction(startup.id, 'approve')}
                      isActionPending={isActionPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="potential">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    Potential Spam ({potentialSpam.length})
                  </CardTitle>
                  <CardDescription>
                    Submissions that may be spam but require review
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingIndicator size="lg" />
                </div>
              ) : potentialSpam.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-lg">
                  <p className="text-muted-foreground">No potential spam detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {potentialSpam.map((startup) => (
                    <SpamCard 
                      key={startup.id}
                      startup={startup}
                      onPreview={() => handlePreview(startup)}
                      onDelete={() => handleAction(startup.id, 'delete')}
                      onFlag={() => handleAction(startup.id, 'flag')}
                      onReject={() => handleAction(startup.id, 'reject')}
                      onApprove={() => handleAction(startup.id, 'approve')}
                      isActionPending={isActionPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Submissions ({filteredStartups.length})</CardTitle>
              <CardDescription>
                Review all startup submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingIndicator size="lg" />
                </div>
              ) : filteredStartups.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-lg">
                  <p className="text-muted-foreground">No startups found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStartups.slice(0, 20).map((startup) => (
                    <SpamCard 
                      key={startup.id}
                      startup={startup}
                      onPreview={() => handlePreview(startup)}
                      onDelete={() => handleAction(startup.id, 'delete')}
                      onFlag={() => handleAction(startup.id, 'flag')}
                      onReject={() => handleAction(startup.id, 'reject')}
                      onApprove={() => handleAction(startup.id, 'approve')}
                      isActionPending={isActionPending}
                    />
                  ))}
                  {filteredStartups.length > 20 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Showing 20 of {filteredStartups.length} results
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Startup Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedStartup?.name || "Startup Preview"}</DialogTitle>
            <DialogDescription>
              Review startup details before making a decision
            </DialogDescription>
          </DialogHeader>
          
          {selectedStartup && (
            <div className="mt-4 space-y-6">
              {/* Status Badge */}
              <div className="flex flex-wrap gap-2">
                <Badge className={`${
                  selectedStartup.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  selectedStartup.status === 'approved' ? 'bg-green-100 text-green-800' :
                  selectedStartup.status === 'flagged_spam' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {formatStatus(selectedStartup.status) || "Unknown"}
                </Badge>
                
                {selectedStartup.slug && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>Slug:</span> {selectedStartup.slug}
                  </Badge>
                )}
                
                {selectedStartup.spamScore >= 3 && (
                  <Badge className="bg-red-100 text-red-800">
                    High Risk
                  </Badge>
                )}
                
                {selectedStartup.spamScore > 0 && selectedStartup.spamScore < 3 && (
                  <Badge className="bg-amber-100 text-amber-800">
                    Suspicious
                  </Badge>
                )}
              </div>
              
              {/* User Info */}
              {selectedStartup.profiles && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Submitter Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Name:</span> {selectedStartup.profiles.full_name || "Unknown"}
                    </p>
                    {selectedStartup.profiles.email && (
                      <p>
                        <span className="font-medium">Email:</span> {selectedStartup.profiles.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{new Date(selectedStartup.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{new Date(selectedStartup.updated_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{selectedStartup.user_id || "Unknown"}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Startup ID</h3>
                  <p className="text-sm font-mono">{selectedStartup.id}</p>
                </div>
              </div>
              
              {/* Logo Preview */}
              {selectedStartup.logo_url && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Logo</h3>
                  <div className="w-20 h-20 rounded-lg overflow-hidden border">
                    <img 
                      src={selectedStartup.logo_url} 
                      alt={`${selectedStartup.name} logo`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <div className="p-4 bg-muted/20 rounded-md max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{selectedStartup.description || "No description provided"}</p>
                </div>
              </div>
              
              {/* Spam Info */}
              {selectedStartup.spamScore > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Spam Detection
                  </h3>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-md">
                    <p className="text-sm font-medium">
                      Spam Score: {selectedStartup.spamScore}
                    </p>
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Reasons:</h4>
                      <ul className="text-xs list-disc list-inside">
                        {selectedStartup.spamReasons?.map((reason: string, i: number) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap mt-6">
            <div>
              {selectedStartup?.slug && (
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <Link href={`/startups/${selectedStartup.slug}`} target="_blank">
                    Preview on Site
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-200 hover:bg-red-100 hover:text-red-900"
                onClick={() => {
                  if (selectedStartup) {
                    handleAction(selectedStartup.id, 'delete');
                    setPreviewOpen(false);
                  }
                }}
                disabled={isActionPending}
              >
                Delete Startup
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-200 hover:bg-red-100 hover:text-red-900"
                onClick={() => {
                  if (selectedStartup) {
                    handleAction(selectedStartup.id, 'flag');
                    setPreviewOpen(false);
                  }
                }}
                disabled={isActionPending}
              >
                Flag as Spam
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface SpamCardProps {
  startup: any;
  onPreview: () => void;
  onDelete: () => void;
  onFlag: () => void;
  onReject: () => void;
  onApprove: () => void;
  isActionPending: boolean;
}

function SpamCard({ 
  startup, 
  onPreview,
  onDelete,
  onFlag,
  onReject,
  onApprove,
  isActionPending
}: SpamCardProps) {
  const cardClass = startup.spamScore >= 3 
    ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" 
    : startup.spamScore > 0
    ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"
    : "border-gray-200";

  // Get user information
  const userName = startup.profiles?.full_name || "Unknown";
  const userEmail = startup.profiles?.email || null;

  return (
    <Card className={`overflow-hidden ${cardClass}`}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-9">
            <div className="flex items-start md:items-center flex-col md:flex-row gap-2 mb-2">
              <div className="flex items-center gap-2">
                {startup.logo_url && (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img 
                      src={startup.logo_url} 
                      alt={`${startup.name} logo`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-medium">{truncate(startup.name, 30)}</h3>
              </div>
              
              <div className="flex flex-wrap gap-1">
                <Badge className={`text-xs ${getBadgeColor(startup.status)}`}>
                  {formatStatus(startup.status)}
                </Badge>
                
                {startup.spamScore >= 3 && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    High Risk
                  </Badge>
                )}
                
                {startup.spamScore > 0 && startup.spamScore < 3 && (
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    Suspicious
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <User className="h-3 w-3" />
              <span>{userName}</span>
              {userEmail && (
                <span className="text-muted-foreground/70 hidden md:inline">
                  ({userEmail})
                </span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Created: {new Date(startup.created_at).toLocaleString()}
            </p>
            
            <p className="text-sm mt-2 line-clamp-2">
              {truncate(startup.description, 150) || "No description"}
            </p>
            
            {startup.spamReasons && startup.spamReasons.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-red-600 dark:text-red-400">
                  <span className="font-medium">Issues: </span>
                  {startup.spamReasons.slice(0, 2).join(', ')}
                  {startup.spamReasons.length > 2 && '...'}
                </p>
              </div>
            )}
          </div>
          
          <div className="md:col-span-3 flex flex-row md:flex-col gap-2 justify-end items-end md:items-stretch">
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={onPreview}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  disabled={isActionPending}
                >
                  <span className="mr-1">Actions</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Startup Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onApprove}>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onReject}>
                  <XCircle className="h-4 w-4 mr-2 text-amber-600" />
                  Reject
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onFlag}>
                  <Shield className="h-4 w-4 mr-2 text-red-600" />
                  Flag as Spam
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Delete Permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
function truncate(str: string | null | undefined, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'flagged_spam': 'Spam'
  };
  return statusMap[status.toLowerCase()] || status;
}

function getBadgeColor(status: string | null | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusColors: Record<string, string> = {
    'pending': 'bg-amber-100 text-amber-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'flagged_spam': 'bg-purple-100 text-purple-800'
  };
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
} 