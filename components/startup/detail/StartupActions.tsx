"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Button } from "@/components/ui/button"
import { Bookmark, Share2, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Startup } from "@/types/startup"
import { MotionDiv } from "@/components/ui/motion"
import { UpvoteButton } from "@/components/ui/upvote-button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StartupActionsProps {
  startup: Startup
  userId: string | null
}

export default function StartupActions({ startup, userId }: StartupActionsProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isVoting, setIsVoting] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(startup.votes?.upvotes || 0)
  const [hasVoted, setHasVoted] = useState<boolean>(false)
  const [isCreator, setIsCreator] = useState(false)

  // Ensure startup ID is available
  if (!startup || !startup.id) {
    console.error("Missing startup data:", startup);
    return null;
  }

  // Check if user has already voted and if user is the creator
  useEffect(() => {
    async function checkVoteAndCreator() {
      if (!userId) return;
      
      try {
        // Check if user has voted
        const { data } = await supabase
          .from("votes")
          .select("vote")
          .eq("startup_id", startup.id)
          .eq("user_id", userId)
          .maybeSingle();
        
        if (data && data.vote) {
          setHasVoted(true);
        }
        
        // Check if user is the creator
        setIsCreator(userId === startup.user_id);
      } catch (error) {
        console.error("Error checking vote status:", error);
      }
    }
    
    checkVoteAndCreator();
  }, [userId, startup.id, startup.user_id, supabase]);

  const handleUpvote = async () => {
    try {
      // Prevent upvoting if this is the creator
      if (isCreator) {
        toast({
          title: "Cannot upvote own startup",
          description: "You cannot upvote your own startup",
          variant: "destructive",
        })
        return;
      }
      
      setIsVoting(true)

      // Use the userId prop instead of fetching session
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upvote startups.",
          variant: "destructive",
        })
        router.push(`/login?redirect=/startups/${startup.slug}`)
        return
      }

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id, vote")
        .eq("startup_id", startup.id)
        .eq("user_id", userId)
        .maybeSingle()

      if (existingVote) {
        // User has already voted
        if (existingVote.vote) {
          toast({
            title: "Already upvoted",
            description: `You've already upvoted this startup.`,
          })
        } else {
          // Update from downvote to upvote
          await supabase
            .from("votes")
            .update({ vote: true, updated_at: new Date().toISOString() })
            .eq("id", existingVote.id)

          // Update local state
          setUpvoteCount(prev => prev + 1)
          setHasVoted(true)

          toast({
            title: "Vote updated",
            description: `You've upvoted ${startup.name}.`,
          })
        }
      } else {
        // Create new vote
        await supabase.from("votes").insert({
          startup_id: startup.id,
          user_id: userId,
          vote: true,
        })

        // Update local state
        setUpvoteCount(prev => prev + 1)
        setHasVoted(true)

        toast({
          title: "Upvote recorded",
          description: `You've upvoted ${startup.name}.`,
        })
      }

      // Refresh the page to update the vote count
      router.refresh()
    } catch (error) {
      console.error("Error upvoting:", error)
      toast({
        title: "Error",
        description: "There was a problem recording your upvote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleAddToWishlist = async () => {
    try {
      setIsAddingToWishlist(true)

      // Use the userId prop instead of fetching session
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add startups to your wishlist.",
          variant: "destructive",
        })
        router.push(`/login?redirect=/startups/${startup.slug}`)
        return
      }

      // Check if user has investor role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", userId)
        .maybeSingle()
      
      // If no profile or role found, deny access
      if (!profile || !profile.role_id) {
        toast({
          title: "Permission denied",
          description: "Only investors can add startups to their wishlist.",
          variant: "destructive",
        })
        return
      }
      
      // Fetch role information
      const { data: roleData } = await supabase
        .from("roles")
        .select("name")
        .eq("id", profile.role_id)
        .maybeSingle()
      
      const roleName = roleData?.name
      if (roleName !== "investor" && roleName !== "admin") {
        toast({
          title: "Permission denied",
          description: "Only investors can add startups to their wishlist.",
          variant: "destructive",
        })
        return
      }

      // Check if startup is already in wishlist
      const { data: existingWishlist } = await supabase
        .from("wishlist")
        .select("id")
        .eq("startup_id", startup.id)
        .eq("user_id", userId)
        .maybeSingle() // Use maybeSingle to handle potential missing data

      if (existingWishlist) {
        // Remove from wishlist
        await supabase.from("wishlist").delete().eq("id", existingWishlist.id)

        toast({
          title: "Removed from wishlist",
          description: `${startup.name} has been removed from your wishlist.`,
        })
      } else {
        // Add to wishlist
        await supabase.from("wishlist").insert({
          startup_id: startup.id,
          user_id: userId,
        })

        toast({
          title: "Added to wishlist",
          description: `${startup.name} has been added to your wishlist.`,
        })
      }

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error updating wishlist:", error)
      toast({
        title: "Error",
        description: "There was a problem updating your wishlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: startup.name,
          text: startup.description || `Check out ${startup.name} on Venture Connect`,
          url: window.location.href,
        })
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "The link to this startup has been copied to your clipboard.",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  return (
    <MotionDiv
      className="flex flex-wrap gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        {isCreator ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{upvoteCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>You cannot upvote your own startup</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <UpvoteButton 
            count={upvoteCount}
            onUpvote={handleUpvote}
            isActive={hasVoted}
            isLoading={isVoting}
            size="md"
          />
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddToWishlist}
        disabled={isAddingToWishlist}
        className="flex items-center gap-1 rounded-full"
      >
        <Bookmark className="h-4 w-4" />
        <span>Save</span>
      </Button>

      <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-1 rounded-full">
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </Button>
    </MotionDiv>
  )
}
