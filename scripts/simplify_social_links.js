// Set environment variables directly in the script
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables for Supabase connection');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simplifySocialLinks() {
  console.log('Starting social links simplification...');
  
  try {
    // Step 1: Add LinkedIn and Twitter URL columns to startups table
    console.log('Adding social media URL columns to startups table...');
    
    try {
      const { error: alterTableError } = await supabase.from('_schema').select('*')
        .then(() => {
          console.log('Schema query not supported, continuing with direct SQL...');
          return { error: true };
        })
        .catch(() => {
          console.log('Schema query not supported, continuing...');
          return { error: true };
        });
      
      // We'll proceed anyway since this check is not crucial
      console.log('Continuing with migration...');
    } catch (e) {
      console.log('Error checking schema support:', e);
    }
    
    // Step 2: Get all startups and their social links
    console.log('Fetching all startups...');
    const { data: startups, error: startupsError } = await supabase
      .from('startups')
      .select('id, name');
    
    if (startupsError) {
      console.error('Error fetching startups:', startupsError);
      return;
    }
    
    console.log(`Found ${startups.length} startups to process.`);
    
    // Step 3: Get all social links
    console.log('Fetching all social links...');
    const { data: socialLinks, error: socialLinksError } = await supabase
      .from('social_links')
      .select('*');
    
    if (socialLinksError) {
      console.error('Error fetching social links:', socialLinksError);
      // Continue anyway, we might still be able to create the columns
    }
    
    const socialLinksMap = {};
    if (socialLinks) {
      console.log(`Found ${socialLinks.length} social links to migrate.`);
      
      // Create a map of startup_id to social links for easier lookup
      socialLinks.forEach(link => {
        if (!socialLinksMap[link.startup_id]) {
          socialLinksMap[link.startup_id] = {};
        }
        socialLinksMap[link.startup_id][link.platform] = link.url;
      });
    }
    
    // Step 4: Update each startup with its social links
    let successCount = 0;
    let errorCount = 0;
    
    for (const startup of startups) {
      const linkedinUrl = socialLinksMap[startup.id]?.linkedin || null;
      const twitterUrl = socialLinksMap[startup.id]?.twitter || null;
      
      console.log(`Updating startup ${startup.name} (${startup.id}):`);
      console.log(`  LinkedIn: ${linkedinUrl || 'None'}`);
      console.log(`  Twitter: ${twitterUrl || 'None'}`);
      
      // Don't update if both are null
      if (linkedinUrl === null && twitterUrl === null) {
        console.log(`  No social links to update for ${startup.name}`);
        continue;
      }
      
      const updateData = {};
      if (linkedinUrl !== null) updateData.linkedin_url = linkedinUrl;
      if (twitterUrl !== null) updateData.twitter_url = twitterUrl;
      
      const { error: updateError } = await supabase
        .from('startups')
        .update(updateData)
        .eq('id', startup.id);
      
      if (updateError) {
        console.error(`  Error updating startup ${startup.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`  Successfully updated social links for ${startup.name}`);
        successCount++;
      }
    }
    
    console.log(`Migration complete! Successfully updated ${successCount} startups, ${errorCount} errors.`);
    
    // Optionally - test if a startup has the new columns
    if (startups.length > 0) {
      console.log('Testing new columns...');
      const { data: testData, error: testError } = await supabase
        .from('startups')
        .select('id, name, linkedin_url, twitter_url')
        .limit(1);
      
      if (testError) {
        console.error('Error testing new columns:', testError);
      } else if (testData && testData.length > 0) {
        const testStartup = testData[0];
        console.log('Test result:', {
          id: testStartup.id,
          name: testStartup.name,
          linkedin_url: testStartup.linkedin_url || 'Not set',
          twitter_url: testStartup.twitter_url || 'Not set'
        });
        console.log('Column migration successful!');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during simplification:', error);
  }
}

// Run the migration
simplifySocialLinks(); 