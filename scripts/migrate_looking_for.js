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

async function migrateLookingFor() {
  console.log('Starting looking_for migration...');
  
  try {
    // Step 1: Add looking_for column to startups table if it doesn't exist
    console.log('Adding looking_for column to startups table...');
    
    try {
      // We can't use supabase's RPC due to limitations, so we'll use the direct approach
      console.log('Using direct approach to check startups table structure');
      
      // First, let's check if the column already exists
      const { data: checkData, error: checkError } = await supabase
        .from('startups')
        .select('looking_for')
        .limit(1)
        .catch(() => {
          console.log('Column check failed, column likely does not exist');
          return { error: true };
        });
      
      if (checkError) {
        console.log('Looking_for column does not exist yet, proceeding with migration');
      } else {
        console.log('Looking_for column already exists, skipping column creation');
      }
    } catch (e) {
      console.log('Error checking column existence:', e);
    }
    
    // Step 2: Get all startups
    console.log('Fetching all startups...');
    const { data: startups, error: startupsError } = await supabase
      .from('startups')
      .select('id, name');
    
    if (startupsError) {
      console.error('Error fetching startups:', startupsError);
      return;
    }
    
    console.log(`Found ${startups.length} startups to process.`);
    
    // Step 3: Get all looking_for options from junction table
    console.log('Fetching all looking_for options...');
    const { data: lookingForOptions, error: lookingForError } = await supabase
      .from('startup_looking_for')
      .select('startup_id, option_id');
    
    if (lookingForError) {
      console.error('Error fetching looking_for options:', lookingForError);
      console.log('Continuing anyway, we will create empty arrays');
    }
    
    // Create a map of startup_id to looking_for options
    const lookingForMap = {};
    
    if (lookingForOptions) {
      lookingForOptions.forEach(item => {
        if (!lookingForMap[item.startup_id]) {
          lookingForMap[item.startup_id] = [];
        }
        lookingForMap[item.startup_id].push(item.option_id);
      });
      
      console.log(`Found looking_for options for ${Object.keys(lookingForMap).length} startups`);
    }
    
    // Step 4: Update each startup with its looking_for options
    let successCount = 0;
    let errorCount = 0;
    
    for (const startup of startups) {
      const lookingFor = lookingForMap[startup.id] || [];
      
      console.log(`Updating startup ${startup.name} (${startup.id}) with looking_for options:`, lookingFor);
      
      const { error: updateError } = await supabase
        .from('startups')
        .update({ looking_for: lookingFor })
        .eq('id', startup.id);
      
      if (updateError) {
        console.error(`Error updating startup ${startup.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`Successfully updated looking_for options for ${startup.name}`);
        successCount++;
      }
    }
    
    console.log(`Migration complete! Successfully updated ${successCount} startups, ${errorCount} errors.`);
    
    // Verify by testing a startup
    if (startups.length > 0) {
      const testId = startups[0].id;
      console.log(`Testing by fetching first startup (ID: ${testId})...`);
      
      const { data: testStartup, error: testError } = await supabase
        .from('startups')
        .select('id, name, looking_for')
        .eq('id', testId)
        .single();
      
      if (testError) {
        console.error('Error testing first startup:', testError);
      } else {
        console.log('Test result:', {
          id: testStartup.id,
          name: testStartup.name,
          looking_for: testStartup.looking_for || []
        });
        console.log('Looking_for successfully migrated!');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during migration:', error);
  }
}

// Run the migration
migrateLookingFor(); 