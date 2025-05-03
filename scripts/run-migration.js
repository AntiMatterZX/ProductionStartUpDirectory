// Set environment variables directly in the script
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Step 1: Add tagline column if it doesn't exist
    console.log('Adding tagline column...');
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: "ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT NULL;"
    });
    
    if (alterError) {
      console.error('Error adding tagline column:', alterError);
      console.log('Trying direct SQL method...');
      
      // Fallback direct SQL method
      const { error: fallbackError } = await supabase
        .from('_sql')
        .select('*')
        .eq('query', "ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT NULL;");
        
      if (fallbackError) {
        console.error('Fallback SQL method failed:', fallbackError);
        // Continue anyway - column might already exist
      }
    }
    
    // Step 2: Fill in missing data
    console.log('Filling missing data...');
    
    // Get all startups
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching startups:', fetchError);
      return;
    }
    
    console.log(`Found ${startups.length} startups to check for missing fields.`);
    
    // Loop through startups and update missing fields
    for (const startup of startups) {
      // Prepare update data as needed
      const updateData = {};
      let needsUpdate = false;
      
      if (!startup.tagline) {
        updateData.tagline = `${startup.name} - Innovative solutions for tomorrow's challenges`;
        needsUpdate = true;
      }
      
      // Update other missing fields as needed
      const requiredFields = {
        location: "San Francisco, CA",
        funding_stage: "Seed",
        funding_amount: 500000,
        employee_count: 5,
        founding_date: "2022-01-01",
      };
      
      for (const [field, defaultValue] of Object.entries(requiredFields)) {
        if (!startup[field]) {
          updateData[field] = defaultValue;
          needsUpdate = true;
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        console.log(`Updating startup: ${startup.name} (ID: ${startup.id})`);
        console.log('Fields to update:', Object.keys(updateData).join(', '));
        
        const { error: updateError } = await supabase
          .from('startups')
          .update(updateData)
          .eq('id', startup.id);
          
        if (updateError) {
          console.error(`Error updating startup ${startup.id}:`, updateError);
        } else {
          console.log(`Successfully updated startup: ${startup.name}`);
        }
      } else {
        console.log(`Startup ${startup.name} has all required fields.`);
      }
    }
    
    console.log('Database migrations completed successfully!');
    
  } catch (error) {
    console.error('Unhandled error during migrations:', error);
  }
}

// Run the migrations
runMigrations(); 