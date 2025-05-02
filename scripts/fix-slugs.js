const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client with direct credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Slug generator functions (copied from the TypeScript version)
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

async function checkSlugAvailability(slug, supabase, currentStartupId) {
  if (!slug || slug.length < 3) {
    return false;
  }
  
  // Make sure slug adheres to our requirements
  const validSlugPattern = /^[a-z0-9-]+$/;
  if (!validSlugPattern.test(slug)) {
    return false;
  }
  
  let query = supabase.from('startups').select('id').eq('slug', slug);

  // If we're updating an existing startup, exclude it from the check
  if (currentStartupId) {
    query = query.neq('id', currentStartupId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }

  // If no data returned, the slug is available
  return data.length === 0;
}

async function generateUniqueSlug(baseName, supabase, currentStartupId) {
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

async function fixStartupSlugs() {
  console.log('Starting to fix startup slugs...');
  
  // Fetch all startups
  const { data: startups, error } = await supabase
    .from('startups')
    .select('id, name, slug');
  
  if (error) {
    console.error('Error fetching startups:', error);
    return;
  }
  
  console.log(`Found ${startups.length} startups to check`);
  
  let fixCount = 0;
  
  // Process each startup
  for (const startup of startups) {
    // Check if slug needs fixing by testing it against our validation
    const validSlugPattern = /^[a-z0-9-]+$/;
    const isValid = startup.slug && 
                   validSlugPattern.test(startup.slug) && 
                   startup.slug.length >= 3 && 
                   startup.slug.length <= 50;
    
    if (!isValid) {
      console.log(`Fixing invalid slug for startup "${startup.name}" (${startup.id}): "${startup.slug}"`);
      
      // Generate a new unique slug
      const newSlug = await generateUniqueSlug(startup.name, supabase, startup.id);
      
      // Update the startup with the new slug
      const { error: updateError } = await supabase
        .from('startups')
        .update({ slug: newSlug })
        .eq('id', startup.id);
      
      if (updateError) {
        console.error(`Error updating slug for startup ${startup.id}:`, updateError);
      } else {
        console.log(`Updated slug for "${startup.name}": "${startup.slug}" → "${newSlug}"`);
        fixCount++;
      }
    }
  }
  
  console.log(`Fixed ${fixCount} startup slugs`);
}

// Run the function
fixStartupSlugs()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err))
  .finally(() => process.exit(0)); 