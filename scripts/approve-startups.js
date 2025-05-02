const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials
const supabaseUrl = 'https://ztdsrfvzltszbumrrkdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A';

// Connect to Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Approve all startups
async function approveAllStartups() {
  console.log("Starting to approve all startups...");
  
  try {
    // Update all pending startups to approved status
    const { data, error } = await supabase
      .from('startups')
      .update({ status: 'approved' })
      .eq('status', 'pending')
      .select('id, name, slug');
    
    if (error) {
      console.error("Error approving startups:", error);
      return;
    }
    
    console.log(`Successfully approved ${data.length} startups:`);
    data.forEach((startup, index) => {
      console.log(`${index + 1}. ${startup.name} (ID: ${startup.id}, Slug: ${startup.slug})`);
    });
    
  } catch (err) {
    console.error("Script error:", err);
  }
}

// Run the function
approveAllStartups()
  .then(() => console.log("Script finished!"))
  .catch(err => console.error("Fatal error:", err)); 