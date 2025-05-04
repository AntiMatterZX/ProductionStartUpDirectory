"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from "@/lib/supabase/client-component";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Filter, Rocket, BookmarkPlus } from "lucide-react";
import Link from "next/link";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

export default function InvestorOpportunitiesPage() {
  const [startups, setStartups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [fundingStages, setFundingStages] = useState<string[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch categories for filter
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
          .order("name");
          
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
        // Fetch approved startups
        const { data: startupsData, error: startupsError } = await supabase
          .from("startups")
          .select(`
            *,
            categories(id, name)
          `)
          .eq("status", "approved")
          .order("created_at", { ascending: false });
          
        if (startupsError) throw startupsError;
        setStartups(startupsData || []);
        
        // Extract unique funding stages
        const uniqueStages = Array.from(
          new Set(startupsData?.map(startup => startup.funding_stage).filter(Boolean))
        ) as string[];
        setFundingStages(uniqueStages);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const addToWishlist = async (startupId: string) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to add startups to your wishlist",
          variant: "destructive",
        });
        return;
      }
      
      // Check if already in wishlist
      const { data: existingItems, error: checkError } = await supabase
        .from("investor_wishlist")
        .select()
        .eq("user_id", session.user.id)
        .eq("startup_id", startupId);
        
      if (checkError) throw checkError;
      
      if (existingItems && existingItems.length > 0) {
        toast({
          title: "Already in wishlist",
          description: "This startup is already in your wishlist",
        });
        return;
      }
      
      // Add to wishlist
      const { error } = await supabase
        .from("investor_wishlist")
        .insert({
          user_id: session.user.id,
          startup_id: startupId,
        });
        
      if (error) throw error;
      
      toast({
        title: "Added to wishlist",
        description: "Startup has been added to your wishlist",
      });
      
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to add startup to wishlist",
        variant: "destructive",
      });
    }
  };

  // Apply filters
  const filteredStartups = startups.filter(startup => {
    // Filter by category
    if (categoryFilter !== "all" && startup.category_id.toString() !== categoryFilter) {
      return false;
    }
    
    // Filter by funding stage
    if (stageFilter !== "all" && startup.funding_stage !== stageFilter) {
      return false;
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-2">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investment Opportunities</h1>
        <p className="text-muted-foreground">
          Discover potential investment opportunities from approved startups
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Card className="flex-1">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Category</p>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Funding Stage</p>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {fundingStages.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredStartups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup) => (
            <Card key={startup.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Link href={`/dashboard/startups/${startup.id}`} className="hover:underline">
                    <CardTitle className="text-xl">{startup.name}</CardTitle>
                  </Link>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => addToWishlist(startup.id)}
                        >
                          <BookmarkPlus className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add to wishlist</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-muted-foreground">
                    {startup.categories?.name}
                  </div>
                  {startup.funding_stage && (
                    <Badge variant="outline" className="font-normal">
                      {startup.funding_stage}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm mb-4">
                  {startup.tagline || "No tagline available"}
                </p>
                {startup.funding_amount && (
                  <p className="text-sm mb-4">
                    <span className="font-medium">Funding:</span> ${parseInt(startup.funding_amount).toLocaleString()}
                  </p>
                )}
                <div className="mt-4">
                  <Link href={`/dashboard/startups/${startup.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-4">
            <Rocket className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-medium mb-2">No startups match your filters</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Try adjusting your filter settings or check back later for new startups.
          </p>
          <Button onClick={() => {
            setCategoryFilter("all");
            setStageFilter("all");
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
} 