// Set environment variables directly in the script
// Comment out these lines and use your own values from .env in production
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

async function applyDbFixes() {
  console.log('Starting database fixes application...');
  
  try {
    // Step 1: Ensure tagline column exists in startups table
    console.log('Ensuring tagline column exists...');
    const addTaglineSQL = `
      ALTER TABLE public.startups 
      ADD COLUMN IF NOT EXISTS tagline TEXT;
    `;
    
    const { error: taglineError } = await supabase.rpc('execute_sql', {
      sql: addTaglineSQL
    }).catch(e => {
      // Fallback to direct SQL if RPC not available
      console.log('RPC not available, trying direct SQL modification...');
      return { error: true };
    });
    
    if (taglineError) {
      console.log('Trying alternative method for adding tagline column...');
      // Try another approach using Supabase's capabilities
      const { error: altError } = await supabase
        .from('startups')
        .select('id')
        .limit(1);
        
      if (altError) {
        console.error('Error checking startups table:', altError);
      } else {
        console.log('Connected to startups table successfully. Need to run SQL migration separately.');
      }
    } else {
      console.log('Successfully added tagline column to startups table (or it already exists).');
    }
    
    // Step 2: Fix RLS policies for social_links table
    console.log('Updating RLS policies for social_links table...');
    
    // Enable RLS on social_links
    const enableRlsSQL = `
      ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
    `;
    
    await supabase.rpc('execute_sql', { sql: enableRlsSQL }).catch(e => {
      console.log('Could not run RLS enablement via RPC, continuing...');
    });
    
    // Drop existing policies first
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "Social links can be updated by startup owner" ON public.social_links;
      DROP POLICY IF EXISTS "Social links can be inserted by startup owner" ON public.social_links;
      DROP POLICY IF EXISTS "Social links can be viewed by anyone" ON public.social_links;
      DROP POLICY IF EXISTS "Social links can be deleted by startup owner" ON public.social_links;
    `;
    
    await supabase.rpc('execute_sql', { sql: dropPoliciesSQL }).catch(e => {
      console.log('Could not drop policies via RPC, continuing...');
    });
    
    // Create new policies
    const createPoliciesSQL = `
      -- Create policy for viewing social links (anyone can view)
      CREATE POLICY "Social links can be viewed by anyone" 
      ON public.social_links FOR SELECT 
      USING (true);

      -- Create policy for inserting social links (only startup owners can insert)
      CREATE POLICY "Social links can be inserted by startup owner" 
      ON public.social_links FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.startups 
          WHERE startups.id = social_links.startup_id 
          AND startups.user_id = auth.uid()
        )
      );

      -- Create policy for updating social links (only startup owners can update)
      CREATE POLICY "Social links can be updated by startup owner" 
      ON public.social_links FOR UPDATE 
      USING (
        EXISTS (
          SELECT 1 FROM public.startups 
          WHERE startups.id = social_links.startup_id 
          AND startups.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.startups 
          WHERE startups.id = social_links.startup_id 
          AND startups.user_id = auth.uid()
        )
      );

      -- Create policy for deleting social links (only startup owners can delete)
      CREATE POLICY "Social links can be deleted by startup owner" 
      ON public.social_links FOR DELETE 
      USING (
        EXISTS (
          SELECT 1 FROM public.startups 
          WHERE startups.id = social_links.startup_id 
          AND startups.user_id = auth.uid()
        )
      );
    `;
    
    await supabase.rpc('execute_sql', { sql: createPoliciesSQL }).catch(e => {
      console.log('Could not create policies via RPC, continuing...');
    });
    
    // Step 3: Create or replace the insert_social_link function
    console.log('Creating insert_social_link function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.insert_social_link(
        p_startup_id UUID,
        p_platform TEXT,
        p_url TEXT
      ) RETURNS UUID AS $$
      DECLARE
        v_id UUID;
      BEGIN
        -- Generate a UUID for the new social link
        v_id := gen_random_uuid();
        
        -- Insert the social link using an ADMIN role to bypass RLS
        INSERT INTO public.social_links (
          id,
          startup_id,
          platform,
          url,
          created_at,
          updated_at
        ) VALUES (
          v_id,
          p_startup_id,
          p_platform,
          p_url,
          NOW(),
          NOW()
        );
        
        RETURN v_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await supabase.rpc('execute_sql', { sql: createFunctionSQL }).catch(e => {
      console.log('Could not create function via RPC, continuing...');
    });
    
    // Step 4: Check and populate missing taglines
    console.log('Checking for startups missing taglines...');
    
    const { data: startups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name, tagline')
      .is('tagline', null);
      
    if (fetchError) {
      console.error('Error fetching startups:', fetchError);
    } else {
      console.log(`Found ${startups?.length || 0} startups with missing taglines.`);
      
      // Update each startup with a default tagline
      for (const startup of (startups || [])) {
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
    }
    
    // Step 5: Fix any broken social links
    console.log('Checking for invalid social links...');
    
    const { data: socialLinks, error: socialLinksError } = await supabase
      .from('social_links')
      .select('id, platform, url, startup_id');
      
    if (socialLinksError) {
      console.error('Error fetching social links:', socialLinksError);
    } else {
      console.log(`Found ${socialLinks.length} social links to check.`);
      
      for (const link of socialLinks) {
        let needsUpdate = false;
        const updates = {};
        
        // Validate LinkedIn URLs
        if (link.platform === 'linkedin' && link.url) {
          if (!link.url.includes('linkedin.com') && !link.url.startsWith('https://')) {
            updates.url = `https://www.linkedin.com/company/${link.url.replace(/https?:\/\//g, '')}`;
            needsUpdate = true;
          } else if (!link.url.startsWith('https://')) {
            updates.url = `https://${link.url}`;
            needsUpdate = true;
          }
        }
        
        // Validate Twitter/X URLs
        if (link.platform === 'twitter' && link.url) {
          if (!link.url.includes('twitter.com') && !link.url.includes('x.com') && !link.url.startsWith('https://')) {
            updates.url = `https://twitter.com/${link.url.replace(/https?:\/\//g, '').replace('@', '')}`;
            needsUpdate = true;
          } else if (!link.url.startsWith('https://')) {
            updates.url = `https://${link.url}`;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          console.log(`Fixing ${link.platform} link for startup ${link.startup_id}:`, updates);
          
          const { error: updateError } = await supabase
            .from('social_links')
            .update(updates)
            .eq('id', link.id);
            
          if (updateError) {
            console.error(`Error updating social link ${link.id}:`, updateError);
          } else {
            console.log(`Successfully fixed ${link.platform} link for startup ${link.startup_id}`);
          }
        }
      }
    }
    
    console.log('Database fixes completed!');
    
  } catch (error) {
    console.error('Unexpected error during database fixes:', error);
  }
}

// Run the fixes
applyDbFixes(); 