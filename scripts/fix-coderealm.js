require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixStartupStatuses() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Required environment variables are missing');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all startups that need moderation
    // Exclude ones already with proper moderation status
    console.log('Finding startups that need moderation...');
    const { data: startups, error: searchError } = await supabase
      .from('startups')
      .select('id, name, status, created_at')
      .not('status', 'in', '("pending","approved","rejected")')
      .order('created_at', { ascending: false });

    if (searchError) {
      throw searchError;
    }

    if (!startups || startups.length === 0) {
      console.log('No startups need to be updated. All startups have proper moderation status.');
      return;
    }

    console.log(`Found ${startups.length} startups that need moderation:`);
    startups.forEach(startup => {
      console.log(`- ${startup.name} (ID: ${startup.id}) - Current status: "${startup.status || 'null'}" - Created: ${new Date(startup.created_at).toLocaleString()}`);
    });

    // Update all found startups to pending status
    console.log('\nUpdating startups to "pending" status...');
    
    const startupIds = startups.map(s => s.id);
    const { error: updateError } = await supabase
      .from('startups')
      .update({ status: 'pending' })
      .in('id', startupIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully updated ${startups.length} startups to "pending" status`);
    
    // Verify the updates
    const { data: verifiedStartups, error: verifyError } = await supabase
      .from('startups')
      .select('id, name, status')
      .in('id', startupIds);
      
    if (verifyError) {
      throw verifyError;
    }
    
    console.log('\nVerified updates:');
    verifiedStartups.forEach(startup => {
      console.log(`- ${startup.name} - New status: "${startup.status}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

fixStartupStatuses(); 