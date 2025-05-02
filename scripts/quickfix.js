const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials
const supabaseUrl = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

// Connect to Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Generates a URL-friendly slug from text
function generateSlug(text) {
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
    .substring(0, 50); // Limit length to 50 chars
}

// Check if a slug is valid
function isValidSlug(slug) {
  if (!slug || slug.length < 3) return false;
  
  const validSlugPattern = /^[a-z0-9-]+$/;
  return validSlugPattern.test(slug);
}

// Fix all startup slugs
async function fixAllStartupSlugs() {
  console.log("Starting slug repair process...");
  
  try {
    // Fetch all startups
    const { data: startups, error } = await supabase
      .from('startups')
      .select('id, name, slug');
    
    if (error) {
      console.error("Error fetching startups:", error);
      return;
    }
    
    console.log(`Found ${startups.length} startups to check`);
    
    // Track fixed slugs
    let fixCount = 0;
    
    // Process each startup
    for (const startup of startups) {
      if (!isValidSlug(startup.slug)) {
        console.log(`Invalid slug found for "${startup.name}" (${startup.id}): "${startup.slug || 'NONE'}"`);
        
        // Generate a new slug from the name
        const newSlug = generateSlug(startup.name);
        console.log(`Generated new slug: "${newSlug}"`);
        
        // Update the startup with the new slug
        const { error: updateError } = await supabase
          .from('startups')
          .update({ slug: newSlug })
          .eq('id', startup.id);
        
        if (updateError) {
          console.error(`Error updating slug for ${startup.id}:`, updateError);
        } else {
          console.log(`✅ Successfully updated slug for "${startup.name}"`);
          fixCount++;
        }
      }
    }
    
    console.log(`Repair complete. Fixed ${fixCount} startup slugs.`);
    
  } catch (err) {
    console.error("Script error:", err);
  }
}

// Run the fix function
fixAllStartupSlugs()
  .then(() => console.log("Script finished!"))
  .catch(err => console.error("Fatal error:", err)); 