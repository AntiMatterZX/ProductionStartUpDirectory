require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

/**
 * This script automatically finds and updates new startups to "pending" status
 * It can be run on a schedule (e.g., via cron job) to ensure all new startups 
 * appear in the admin moderation queue
 */
async function autoUpdateStartupStatus() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Required environment variables are missing');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current timestamp for logging
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Auto-update process started`);

    // Find startups with missing or incorrect status (not in the proper moderation statuses)
    const { data: startups, error: searchError } = await supabase
      .from('startups')
      .select('id, name, status, created_at')
      .not('status', 'in', '("pending","approved","rejected")')
      .order('created_at', { ascending: false });

    if (searchError) {
      throw searchError;
    }

    if (!startups || startups.length === 0) {
      console.log(`[${timestamp}] No startups need updates`);
      return;
    }

    console.log(`[${timestamp}] Found ${startups.length} startups that need moderation:`);
    startups.forEach(startup => {
      console.log(`- ${startup.name} (Current status: "${startup.status || 'null'}")`);
    });

    // Update all found startups to pending status
    const startupIds = startups.map(s => s.id);
    const { error: updateError } = await supabase
      .from('startups')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString() 
      })
      .in('id', startupIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`[${timestamp}] Successfully updated ${startups.length} startups to "pending" status`);
    
    // Log the names of updated startups
    console.log(`[${timestamp}] Updated startups: ${startups.map(s => s.name).join(', ')}`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error);
  }
}

// Run the function
autoUpdateStartupStatus(); 