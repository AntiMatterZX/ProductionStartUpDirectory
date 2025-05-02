import { createClient } from '@supabase/supabase-js'
import { generateSlug, generateUniqueSlug } from '../lib/utils/helpers/slug-generator'
import type { Database } from '@/types/database'

// Initialize Supabase client with direct credentials
// You should run this script with proper environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

async function fixStartupSlugs() {
  console.log('Starting to fix startup slugs...')
  
  // Fetch all startups
  const { data: startups, error } = await supabase
    .from('startups')
    .select('id, name, slug')
  
  if (error) {
    console.error('Error fetching startups:', error)
    return
  }
  
  console.log(`Found ${startups.length} startups to check`)
  
  let fixCount = 0
  
  // Process each startup
  for (const startup of startups) {
    // Check if slug needs fixing by testing it against our validation
    const validSlugPattern = /^[a-z0-9-]+$/
    const isValid = startup.slug && 
                   validSlugPattern.test(startup.slug) && 
                   startup.slug.length >= 3 && 
                   startup.slug.length <= 50
    
    if (!isValid) {
      console.log(`Fixing invalid slug for startup "${startup.name}" (${startup.id}): "${startup.slug}"`)
      
      // Generate a new unique slug
      const newSlug = await generateUniqueSlug(startup.name, supabase, startup.id)
      
      // Update the startup with the new slug
      const { error: updateError } = await supabase
        .from('startups')
        .update({ slug: newSlug })
        .eq('id', startup.id)
      
      if (updateError) {
        console.error(`Error updating slug for startup ${startup.id}:`, updateError)
      } else {
        console.log(`Updated slug for "${startup.name}": "${startup.slug}" → "${newSlug}"`)
        fixCount++
      }
    }
  }
  
  console.log(`Fixed ${fixCount} startup slugs`)
}

// Run the function
fixStartupSlugs()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err))
  .finally(() => process.exit(0)) 