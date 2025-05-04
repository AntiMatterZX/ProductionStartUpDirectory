// @ts-nocheck
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Required environment variables are missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStartups() {
  try {
    // Get all startup status values
    const { data: statusData, error: statusError } = await supabase
      .from('startups')
      .select('status')
      .is('status', 'not.null');
    
    if (statusError) {
      console.error('Error fetching status values:', statusError);
      return;
    }
    
    // Analyze and count different status values
    const statusCounts = {};
    statusData.forEach(item => {
      const status = item.status.toString().trim();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Status values found in database:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  "${status}": ${count} startups`);
    });
    
    // Check pending startups specifically
    console.log('\nChecking for CodeRealm and other pending startups:');
    const { data: pendingStartups, error: pendingError } = await supabase
      .from('startups')
      .select('id, name, status, created_at')
      .or('status.ilike.%pending%,name.ilike.%coderealm%');
    
    if (pendingError) {
      console.error('Error fetching pending startups:', pendingError);
      return;
    }
    
    console.log('Startups that match pending or CodeRealm:');
    pendingStartups.forEach(startup => {
      console.log(`  ${startup.name} (ID: ${startup.id}) - Status: "${startup.status}" - Created: ${startup.created_at}`);
    });
    
    // Try fixing CodeRealm if needed
    if (pendingStartups.length > 0) {
      const codeRealmStartup = pendingStartups.find(s => 
        s.name.toLowerCase().includes('coderealm') && s.status !== 'pending'
      );
      
      if (codeRealmStartup) {
        console.log(`\nFound CodeRealm with incorrect status: "${codeRealmStartup.status}"`);
        console.log('Updating to "pending" status...');
        
        const { error: updateError } = await supabase
          .from('startups')
          .update({ status: 'pending' })
          .eq('id', codeRealmStartup.id);
        
        if (updateError) {
          console.error('Error updating status:', updateError);
        } else {
          console.log('Successfully updated CodeRealm status to "pending"');
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkStartups(); 