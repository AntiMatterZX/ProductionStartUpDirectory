const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables for Supabase connection');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTaglineColumnAndMigrateData() {
  console.log('Starting database migration to add tagline column and update records...');
  
  try {
    // Step 1: Check if tagline column exists and add it if needed
    console.log('Checking if tagline column exists...');
    
    // Execute SQL to add the tagline column to the startups table
    // Using raw SQL as the most reliable method
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: "ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT NULL;"
    });
    
    if (alterError) {
      console.error('Error adding tagline column:', alterError);
      return;
    }
    
    console.log('Successfully added tagline column to startups table, or column already exists.');
    
    // Step 2: Update RLS policy to allow updates to the tagline column
    console.log('Updating RLS policies...');
    const { error: policyError } = await supabase.rpc('execute_sql', {
      sql: `
        BEGIN;
        DROP POLICY IF EXISTS "Startups can be updated by owner" ON public.startups;
        CREATE POLICY "Startups can be updated by owner" 
        ON public.startups FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        COMMIT;
      `
    });
    
    if (policyError) {
      console.error('Error updating RLS policies:', policyError);
      // Continue anyway, this might not be fatal
    } else {
      console.log('Successfully updated RLS policies.');
    }
    
    // Step 3: Update existing records with sample data for tagline
    console.log('Updating existing startup records with default tagline values...');
    
    // First, get all startups that don't have a tagline
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name')
      .is('tagline', null);
      
    if (fetchError) {
      console.error('Error fetching startups:', fetchError);
      return;
    }
    
    console.log(`Found ${startups.length} startups that need tagline updates.`);
    
    // Update each startup with a default tagline based on its name
    for (const startup of startups) {
      const defaultTagline = `${startup.name} - Innovative solutions for tomorrow's challenges`;
      
      const { error: updateError } = await supabase
        .from('startups')
        .update({ tagline: defaultTagline })
        .eq('id', startup.id);
        
      if (updateError) {
        console.error(`Error updating tagline for startup ${startup.id}:`, updateError);
      } else {
        console.log(`Updated tagline for startup: ${startup.name}`);
      }
    }
    
    // Step 4: Ensure all related tables have proper RLS policies
    console.log('Ensuring all related tables have proper RLS policies...');
    
    const { error: socialLinksError } = await supabase.rpc('execute_sql', {
      sql: `
        BEGIN;
        DROP POLICY IF EXISTS "Social links can be updated by startup owner" ON public.social_links;
        CREATE POLICY "Social links can be updated by startup owner" 
        ON public.social_links FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.startups 
            WHERE startups.id = social_links.startup_id 
            AND startups.user_id = auth.uid()
          )
        );
        COMMIT;
      `
    });
    
    if (socialLinksError) {
      console.error('Error updating social_links RLS policies:', socialLinksError);
    } else {
      console.log('Successfully updated social_links RLS policies.');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Unhandled error during migration:', error);
  }
}

// Run the migration
addTaglineColumnAndMigrateData(); 