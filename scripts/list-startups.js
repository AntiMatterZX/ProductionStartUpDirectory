const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials
const supabaseUrl = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

// Connect to Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// List all startups
async function listAllStartups() {
  console.log("Fetching all startups from the database...");
  
  try {
    // Fetch all startups with related data
    const { data: startups, error } = await supabase
      .from('startups')
      .select(`
        id, 
        name, 
        slug, 
        status,
        category_id,
        categories(name),
        user_id
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching startups:", error);
      return;
    }
    
    if (!startups || startups.length === 0) {
      console.log("No startups found in the database!");
      return;
    }
    
    console.log(`Found ${startups.length} startups:`);
    console.log("--------------------------------------");
    
    // Display each startup
    startups.forEach((startup, index) => {
      console.log(`[${index + 1}] ${startup.name}`);
      console.log(`   ID: ${startup.id}`);
      console.log(`   Slug: ${startup.slug || 'MISSING'}`);
      console.log(`   Status: ${startup.status}`);
      console.log(`   Category: ${startup.categories?.name || 'Uncategorized'}`);
      console.log(`   User ID: ${startup.user_id || 'No user'}`);
      console.log("--------------------------------------");
    });
    
    console.log("Listing complete.");
    
  } catch (err) {
    console.error("Script error:", err);
  }
}

// Check and fix any invalid slugs
async function fixInvalidSlugs() {
  console.log("Checking for invalid slugs...");
  
  try {
    // Fetch all startups
    const { data: startups, error } = await supabase
      .from('startups')
      .select('id, name, slug');
    
    if (error) {
      console.error("Error fetching startups:", error);
      return;
    }
    
    if (!startups || startups.length === 0) {
      console.log("No startups found to check!");
      return;
    }
    
    console.log(`Checking ${startups.length} startups for invalid slugs...`);
    
    // Track fixed slugs
    let fixCount = 0;
    
    // Process each startup
    for (const startup of startups) {
      // Check if slug is valid
      const isValid = startup.slug && 
                    /^[a-z0-9-]+$/.test(startup.slug) && 
                    startup.slug.length >= 3 && 
                    startup.slug.length <= 50;
                    
      if (!isValid) {
        console.log(`Found invalid slug for "${startup.name}" (${startup.id}): "${startup.slug || 'MISSING'}"`);
        
        // Generate new slug
        let newSlug = startup.name ? startup.name
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-") // Replace spaces with -
          .replace(/&/g, "-and-") // Replace & with 'and'
          .replace(/[^\w\-]+/g, "") // Remove all non-word characters except hyphens
          .replace(/--+/g, "-") // Replace multiple - with single -
          .replace(/^-+/, "") // Trim - from start of text
          .replace(/-+$/, "") // Trim - from end of text
          .substring(0, 50) // Limit length to 50 chars
          : "startup-" + Math.floor(Math.random() * 10000);
        
        // If slug is too short, add a random number
        if (newSlug.length < 3) {
          newSlug = newSlug + "-" + Math.floor(Math.random() * 10000);
        }
        
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
    
    if (fixCount > 0) {
      console.log(`Fixed ${fixCount} invalid slugs.`);
    } else {
      console.log("All slugs are valid! No fixes needed.");
    }
    
  } catch (err) {
    console.error("Error fixing slugs:", err);
  }
}

// Run both functions
async function main() {
  await fixInvalidSlugs();
  await listAllStartups();
}

main()
  .then(() => console.log("Script finished!"))
  .catch(err => console.error("Fatal error:", err)); 