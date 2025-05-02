"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase/client-component"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPinIcon, Users2Icon, Search, ChevronDown, FilterIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MotionDiv } from "@/components/ui/motion"
import { useRouter, useSearchParams } from "next/navigation"
import { createServerComponentClient } from "@/lib/supabase/server-component"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function StartupListingPage() {
  const router = useRouter()
  
  // Get search params - unlike route params, these don't need unwrapping with use()
  const searchParams = useSearchParams()
  
  const supabase = createClientComponentClient()

  const [startups, setStartups] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [totalPages, setTotalPages] = useState(1)

  const category = searchParams.get("category") || ""
  const page = Number.parseInt(searchParams.get("page") || "1")
  const pageSize = 12

  // Define featured categories - these will be shown as buttons
  const featuredCategoryIds = [1, 2, 9, 10, 12]; // replace with actual IDs of your featured categories

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // Fetch categories
      const { data: categoriesData } = await supabase.from("categories").select("id, name, slug").order("name")

      setCategories(categoriesData || [])

      console.log("Fetching startups...");

      // Build query for startups
      let query = supabase
        .from("startups")
        .select(
          `
          *,
          categories(id, name, slug)
        `,
          { count: "exact" },
        )
        // Allow all startups to be displayed for testing
        // .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      // Apply category filter if provided
      if (category) {
        const { data: categoryData } = await supabase.from("categories").select("id").eq("slug", category).single()

        if (categoryData) {
          query = query.eq("category_id", categoryData.id)
        }
      }

      // Apply search filter if provided
      const currentSearchQuery = searchParams.get("q")
      if (currentSearchQuery) {
        query = query.ilike("name", `%${currentSearchQuery}%`)
      }

      // Execute query
      const { data, count, error } = await query
      
      if (error) {
        console.error("Error fetching startups:", error);
      }
      
      console.log("Startups retrieved:", data?.length || 0);
      console.log("Status of startups:", data?.map(s => s.status).join(", "));

      setStartups(data || [])
      setTotalPages(count ? Math.ceil(count / pageSize) : 0)
      setLoading(false)
    }

    fetchData()
  }, [supabase, category, page, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Update URL with search query
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (category) params.set("category", category)

    router.push(`/startups?${params.toString()}`)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  // Get the current category name
  const currentCategoryName = category
    ? categories.find((cat) => cat.slug === category)?.name || ""
    : "All Categories"

  // Separate featured and other categories
  const featuredCategories = categories.filter((cat) => featuredCategoryIds.includes(cat.id))
  const otherCategories = categories.filter((cat) => !featuredCategoryIds.includes(cat.id))

  return (
    <div className="container py-10">
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Startups</h1>
          <p className="text-muted-foreground">
            Discover innovative startups looking for investment, mentorship, and partnerships.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search startups..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" className="ml-2">
            Search
          </Button>
        </form>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by category:</span>
            </div>
            
            {category && (
              <Link href="/startups" className="text-xs text-primary hover:underline">
                Clear filter
              </Link>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Link href="/startups">
              <Button variant={!category ? "default" : "outline"} size="sm">
                All
              </Button>
            </Link>
            
            {/* Show featured categories as buttons */}
            {featuredCategories.map((cat) => (
              <Link key={cat.id} href={`/startups?category=${cat.slug}`}>
                <Button variant={category === cat.slug ? "default" : "outline"} size="sm">
                  {cat.name}
                </Button>
              </Link>
            ))}
            
            {/* Show rest of categories in dropdown */}
            {otherCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    More Categories
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
                  <DropdownMenuRadioGroup value={category}>
                    {otherCategories.map((cat) => (
                      <Link key={cat.id} href={`/startups?category=${cat.slug}`} className="w-full">
                        <DropdownMenuRadioItem value={cat.slug} className="cursor-pointer">
                          {cat.name}
                        </DropdownMenuRadioItem>
                      </Link>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Show active filter if any */}
          {category && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Active filter:</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                {currentCategoryName}
              </Badge>
            </div>
          )}
        </div>
      </MotionDiv>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : startups.length > 0 ? (
        <>
          <MotionDiv
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {startups.map((startup) => (
              <MotionDiv key={startup.id} variants={item} className="h-full">
                <Link href={`/startups/${startup.slug}`}>
                  <Card className="h-full hover:shadow-md transition-shadow card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {startup.logo_url ? (
                            <img
                              src={startup.logo_url || "/placeholder.svg"}
                              alt={startup.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-bold text-primary">{startup.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{startup.name}</h3>
                          <p className="text-sm text-muted-foreground">{startup.categories?.name}</p>
                        </div>
                      </div>

                      <p className="line-clamp-3 text-sm text-muted-foreground mb-4">
                        {startup.description || "No description provided"}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {startup.founding_date && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Founded {new Date(startup.founding_date).getFullYear()}
                          </span>
                        )}
                        {startup.location && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="h-3 w-3" />
                            {startup.location}
                          </span>
                        )}
                        {startup.employee_count && (
                          <span className="flex items-center gap-1">
                            <Users2Icon className="h-3 w-3" />
                            {startup.employee_count} employees
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </MotionDiv>
            ))}
          </MotionDiv>

          {/* Pagination */}
          {totalPages > 1 && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center mt-8"
            >
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={{
                      pathname: "/startups",
                      query: {
                        ...(category ? { category } : {}),
                        ...(searchParams.get("q") ? { q: searchParams.get("q") } : {}),
                        page: page - 1,
                      },
                    }}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}

                <span className="flex items-center px-3 text-sm">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages && (
                  <Link
                    href={{
                      pathname: "/startups",
                      query: {
                        ...(category ? { category } : {}),
                        ...(searchParams.get("q") ? { q: searchParams.get("q") } : {}),
                        page: page + 1,
                      },
                    }}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </MotionDiv>
          )}
        </>
      ) : (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <h2 className="text-xl font-semibold mb-2">No startups found</h2>
          <p className="text-muted-foreground mb-6">
            {searchParams.get("q")
              ? `No startups matching "${searchParams.get("q")}" were found.`
              : category
                ? `No startups in the "${category}" category were found.`
                : "No startups have been added yet."}
          </p>
          <Link href="/dashboard/startups/create">
            <Button>Create Your Startup</Button>
          </Link>
        </MotionDiv>
      )}
    </div>
  )
}
