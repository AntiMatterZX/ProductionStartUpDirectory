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

async function createProfileWithAdminRole(email) {
  console.log(`Creating profile with admin role for: ${email}`);
  
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
  
  // Check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  
  if (existingProfile) {
    console.log(`Profile already exists for user ${email}`);
  }
  
  // Get admin role ID
  const { data: adminRole, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "admin")
    .single();
  
  if (roleError) {
    console.error('Admin role not found, creating it...');
    const { data: newRole, error: createRoleError } = await supabase
      .from("roles")
      .insert({ name: "admin" })
      .select()
      .single();
    
    if (createRoleError) {
      console.error('Failed to create admin role:', createRoleError);
      return;
    }
    
    console.log(`Created admin role with ID: ${newRole.id}`);
    
    // Create profile with admin role
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
        role_id: newRole.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Failed to create profile:', insertError);
      return;
    }
    
    console.log(`Created profile with admin role for user: ${email}`);
    return;
  }
  
  // Create profile with existing admin role
  const { error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
      role_id: adminRole.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (insertError) {
    console.error('Failed to create profile:', insertError);
    return;
  }
  
  console.log(`Created profile with admin role for user: ${email}`);
}

// Email to process
const emailToProcess = process.argv[2] || 'varunbhole@gmail.com';

// Run the function
createProfileWithAdminRole(emailToProcess)
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err))
  .finally(() => process.exit(0)); 