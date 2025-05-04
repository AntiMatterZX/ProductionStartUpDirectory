"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from "@/lib/supabase/client-component";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { BookmarkX } from "lucide-react";
import Link from "next/link";

export default function InvestorWishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function fetchWishlist() {
      try {
        setIsLoading(true);
        
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return;
        }
        
        // Fetch wishlist items
        const { data, error } = await supabase
          .from("investor_wishlist")
          .select(`
            *,
            startups(
              id, 
              name, 
              tagline, 
              status,
              logo_url,
              category_id,
              categories(name)
            )
          `)
          .eq("user_id", session.user.id);

        if (error) {
          throw error;
        }

        setWishlistItems(data || []);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWishlist();
  }, [supabase]);

  const removeFromWishlist = async (wishlistItemId: string) => {
    try {
      const { error } = await supabase
        .from("investor_wishlist")
        .delete()
        .eq("id", wishlistItemId);

      if (error) {
        throw error;
      }

      // Remove item from state
      setWishlistItems(wishlistItems.filter(item => item.id !== wishlistItemId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-2">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">
          Manage startups you've saved to revisit later
        </p>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Link href={`/dashboard/startups/${item.startups.id}`} className="hover:underline">
                    <CardTitle className="text-xl">{item.startups.name}</CardTitle>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    <BookmarkX className="h-5 w-5" />
                  </Button>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.startups.categories?.name}
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm mb-4">
                  {item.startups.tagline}
                </p>
                <div className="mt-4">
                  <Link href={`/dashboard/startups/${item.startups.id}`}>
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
            <BookmarkX className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Explore startups and bookmark ones that interest you to add them to your wishlist.
          </p>
          <Link href="/dashboard/discover">
            <Button>Discover Startups</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 