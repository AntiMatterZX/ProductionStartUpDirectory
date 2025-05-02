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

async function addAdminUser(email) {
  console.log(`Starting process to add admin role for user: ${email}`);
  
  // Look up the user via Supabase Auth Admin API since profiles.email is not available
  console.log(`Looking up user with email: ${email}`);
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }
  
  // Find the user with the matching email
  const user = data.users.find(u => u.email === email);
  if (!user) {
    console.error(`User with email ${email} not found.`);
    return;
  }
  console.log(`Found user: ${user.email} (${user.id})`);
  
  // Check if admin role exists
  const { data: adminRole, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'admin')
    .single();
  
  if (roleError) {
    console.error('Admin role not found:', roleError);
    
    // Create admin role if it doesn't exist
    console.log('Creating admin role...');
    const { data: newRole, error: createRoleError } = await supabase
      .from('roles')
      .insert({ name: 'admin', description: 'Administrator with full access' })
      .select()
      .single();
    
    if (createRoleError) {
      console.error('Failed to create admin role:', createRoleError);
      return;
    }
    
    console.log(`Created admin role with ID: ${newRole.id}`);
    
    // Update user with admin role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role_id: newRole.id })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Failed to update user with admin role:', updateError);
      return;
    }
    
    console.log(`Successfully added admin role to user: ${email}`);
    return;
  }
  
  // Update user with existing admin role
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role_id: adminRole.id })
    .eq('id', user.id);
  
  if (updateError) {
    console.error('Failed to update user with admin role:', updateError);
    return;
  }
  
  console.log(`Successfully added admin role to user: ${email}`);
}

// Email to make admin
const emailToMakeAdmin = process.argv[2] || 'gaurigawade0206@gmail.com';

// Run the function
addAdminUser(emailToMakeAdmin)
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err))
  .finally(() => process.exit(0)); 