const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and key
// These are the same credentials used in list-startups.js
const supabaseUrl = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

// Connect to Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function approveAllStartups() {
  console.log('Starting bulk approval process...');
  
  try {
    // First, get all pending startups
    const { data: pendingStartups, error: fetchError } = await supabase
      .from('startups')
      .select('id, name, status')
      .eq('status', 'pending');
    
    if (fetchError) {
      console.error('Error fetching pending startups:', fetchError);
      return;
    }
    
    if (!pendingStartups || pendingStartups.length === 0) {
      console.log('No pending startups found. Nothing to approve!');
      return;
    }
    
    console.log(`Found ${pendingStartups.length} pending startups to approve:`);
    pendingStartups.forEach(startup => {
      console.log(`- ${startup.name} (ID: ${startup.id})`);
    });
    
    // Update all pending startups to 'approved'
    const { data, error: updateError } = await supabase
      .from('startups')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString() 
      })
      .eq('status', 'pending')
      .select('id, name');
    
    if (updateError) {
      console.error('Error approving startups:', updateError);
      return;
    }
    
    console.log(`✅ Successfully approved ${data.length} startups!`);
    
  } catch (error) {
    console.error('Script execution error:', error);
  }
}

approveAllStartups()
  .then(() => console.log('Script execution complete!'))
  .catch(err => console.error('Fatal error:', err)); 