export function generateSlug(text: string): string {
  if (!text) return "";
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except hyphens
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
    .substring(0, 50); // Limit length to 50 chars to match DB schema
}

export async function checkSlugAvailability(slug: string, supabase: any, currentStartupId?: string): Promise<boolean> {
  if (!slug || slug.length < 3) {
    return false;
  }
  
  // Make sure slug adheres to our requirements
  const validSlugPattern = /^[a-z0-9-]+$/;
  if (!validSlugPattern.test(slug)) {
    return false;
  }
  
  let query = supabase.from("startups").select("id").eq("slug", slug)

  // If we're updating an existing startup, exclude it from the check
  if (currentStartupId) {
    query = query.neq("id", currentStartupId)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    console.error("Error checking slug availability:", error)
    return false
  }

  // If no data returned, the slug is available
  return data.length === 0
}

export async function generateUniqueSlug(baseName: string, supabase: any, currentStartupId?: string): Promise<string> {
  let slug = generateSlug(baseName);
  let isAvailable = await checkSlugAvailability(slug, supabase, currentStartupId);
  
  // If the slug is already taken, append a number until we find an available one
  if (!isAvailable) {
    let counter = 1;
    let newSlug = `${slug}-${counter}`;
    
    while (!(await checkSlugAvailability(newSlug, supabase, currentStartupId)) && counter < 100) {
      counter++;
      newSlug = `${slug}-${counter}`;
    }
    
    return newSlug;
  }
  
  return slug;
}
