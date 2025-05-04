"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Button } from "@/components/ui/button"
import { ThumbsDown, Bookmark, Share2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { Startup } from "@/types/startup"
import { MotionDiv } from "@/components/ui/motion"
import { UpvoteButton } from "@/components/ui/upvote-button"

interface StartupActionsProps {
  startup: Startup
  userId: string | null
}

export default function StartupActions({ startup, userId }: StartupActionsProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isVoting, setIsVoting] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [voteCount, setVoteCount] = useState({
    upvotes: startup.votes?.upvotes || 0,
    downvotes: startup.votes?.downvotes || 0,
  })
  const [hasVoted, setHasVoted] = useState<boolean | null>(null) // null = uninitialized, true = upvoted, false = downvoted

  // Ensure startup ID is available
  if (!startup || !startup.id) {
    console.error("Missing startup data:", startup);
    return null;
  }

  // Check if user has already voted when component mounts
  useEffect(() => {
    async function checkVote() {
      if (!userId) return;
      
      try {
        const { data } = await supabase
          .from("votes")
          .select("vote")
          .eq("startup_id", startup.id)
          .eq("user_id", userId)
          .maybeSingle();
        
        if (data) {
          setHasVoted(data.vote);
        }
      } catch (error) {
        console.error("Error checking vote status:", error);
      }
    }
    
    checkVote();
  }, [userId, startup.id, supabase]);

  const handleVote = async (isUpvote: boolean) => {
    try {
      setIsVoting(true)

      // Use the userId prop instead of fetching session
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to vote for startups.",
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
        .maybeSingle() // Use maybeSingle to handle potential missing data

      if (existingVote) {
        // Update existing vote
        if (existingVote.vote !== isUpvote) {
          await supabase
            .from("votes")
            .update({ vote: isUpvote, updated_at: new Date().toISOString() })
            .eq("id", existingVote.id)

          // Update local state
          setVoteCount((prev) => ({
            upvotes: prev.upvotes + (isUpvote ? 1 : -1),
            downvotes: prev.downvotes + (isUpvote ? -1 : 1),
          }))
          
          setHasVoted(isUpvote)

          toast({
            title: "Vote updated",
            description: `You've changed your vote for ${startup.name}.`,
          })
        } else {
          toast({
            title: "Already voted",
            description: `You've already ${isUpvote ? "upvoted" : "downvoted"} this startup.`,
          })
        }
      } else {
        // Create new vote
        await supabase.from("votes").insert({
          startup_id: startup.id,
          user_id: userId,
          vote: isUpvote,
        })

        // Update local state
        setVoteCount((prev) => ({
          upvotes: prev.upvotes + (isUpvote ? 1 : 0),
          downvotes: prev.downvotes + (isUpvote ? 0 : 1),
        }))
        
        setHasVoted(isUpvote)

        toast({
          title: "Vote recorded",
          description: `You've ${isUpvote ? "upvoted" : "downvoted"} ${startup.name}.`,
        })
      }

      // Refresh the page to update the vote count
      router.refresh()
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "There was a problem recording your vote. Please try again.",
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
        <UpvoteButton 
          count={voteCount.upvotes}
          onUpvote={() => handleVote(true)}
          isActive={hasVoted === true}
          isLoading={isVoting}
          size="md"
        />
        
        <Button
          variant={hasVoted === false ? "default" : "outline"}
          size="sm"
          onClick={() => handleVote(false)}
          disabled={isVoting}
          className={`flex items-center gap-2 rounded-full transition-all duration-300 ${
            hasVoted === false ? "bg-destructive text-destructive-foreground" : ""
          }`}
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="font-medium">{voteCount.downvotes}</span>
        </Button>
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
