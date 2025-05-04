"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ExternalLink } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase/client-component";
import type { Database } from "@/types/database";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

// Simplified StartupCard component directly in this file
interface StartupCardProps {
  startup: any;
}

function StartupCard({ startup }: StartupCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 bg-muted">
        {startup.logo_url ? (
          <Image
            src={startup.logo_url}
            alt={`${startup.name} logo`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/10">
            <span className="text-2xl font-bold text-primary/40">
              {startup.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="mb-2 flex justify-between items-start">
          <h3 className="font-bold text-lg line-clamp-1">{startup.name}</h3>
          {startup.categories && (
            <Badge variant="outline" className="ml-2 text-xs">
              {startup.categories.name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {startup.tagline || "No tagline available"}
        </p>
        <Link href={`/dashboard/startups/${startup.id}`} className="mt-auto">
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function DiscoverPage() {
  const [startups, setStartups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchStartups() {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from("startups")
          .select(`
            *,
            categories(name)
          `)
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        setStartups(data || []);
      } catch (error) {
        console.error("Error fetching startups:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStartups();
  }, [supabase]);

  const filteredStartups = startups.filter((startup) =>
    startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    startup.tagline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    startup.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Startups</h1>
        <p className="text-muted-foreground">
          Explore and discover innovative startups from around the world
        </p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search startups by name, tagline, or description..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Startups</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="newest">Newest</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="h-48 bg-muted rounded-t-lg" />
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredStartups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No startups found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or check back later for new additions.
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="trending" className="pt-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Trending startups coming soon</h3>
            <p className="text-muted-foreground">
              We're working on analyzing popularity metrics to show trending startups.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="newest" className="pt-4">
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStartups.slice(0, 6).map((startup) => (
                <StartupCard key={startup.id} startup={startup} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 