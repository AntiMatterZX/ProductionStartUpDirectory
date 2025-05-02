const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Supabase client with direct credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmin(email) {
  console.log(`Checking admin status for user: ${email}`);
  
  // Find the user by email
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const user = usersData.users.find((u) => u.email === email);
  if (!user) {
    console.error(`User with email ${email} not found.`);
    return;
  }
  
  console.log(`Found user: ${user.email} (${user.id})`);
  
  // Get the user's profile with role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, roles(id, name)")
    .eq("id", user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }
  
  console.log('Profile:', {
    id: profile.id,
    full_name: profile.full_name,
    role_id: profile.role_id
  });
  
  console.log('Role:', profile.roles);
  
  // Check if user is admin
  if (profile.roles && profile.roles.name === 'admin') {
    console.log('✅ User IS an admin');
  } else {
    console.log('❌ User is NOT an admin');
  }
}

// Email to check
const emailToCheck = process.argv[2] || 'varunbhole@gmail.com';

// Run the function
checkAdmin(emailToCheck)
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err))
  .finally(() => process.exit(0)); 