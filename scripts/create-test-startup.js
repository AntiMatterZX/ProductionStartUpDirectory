require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

async function createTestStartup() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Required environment variables are missing');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First get a valid admin user to assign as the startup creator
    console.log('Finding a user to assign as startup creator...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (userError) {
      throw userError;
    }

    if (!users || users.length === 0) {
      console.error('No users found in the database');
      process.exit(1);
    }

    const userId = users[0].id;
    
    // Create a unique slug
    const testId = Math.floor(Math.random() * 10000);
    const name = `Test Startup ${testId}`;
    const slug = `test-startup-${testId}`;
    
    // Create the test startup
    console.log(`Creating test startup: ${name}`);
    const { data: startup, error: insertError } = await supabase
      .from('startups')
      .insert({
        id: uuidv4(),
        name,
        slug,
        description: 'This is a test startup created to verify the moderation system.',
        status: 'pending',
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log('Successfully created test startup with pending status:');
    console.log(startup);
    
  } catch (error) {
    console.error('Error creating test startup:', error);
  }
}

createTestStartup(); 