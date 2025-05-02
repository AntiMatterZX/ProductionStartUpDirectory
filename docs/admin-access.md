# Admin Panel Access Instructions

## Adding an Admin User

To give admin privileges to a user account (e.g., gaurigawade0206@gmail.com), follow these steps:

1. Ensure the user has registered on the platform first.
2. Run the admin script with proper environment variables:

```bash
# First, create a .env file with your Supabase credentials
cat > .env << EOL

NEXT_PUBLIC_SUPABASE_URL=https://ztdsrfvzltszbumrrkdi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZHNyZnZ6bHRzemJ1bXJya2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjA4ODgxOSwiZXhwIjoyMDYxNjY0ODE5fQ.6kFWWx87653efxPy_LNH_7CtIThZwWrdQeUZNOwmM9A

EOL

# Install required packages if not already installed
npm install dotenv @supabase/supabase-js --legacy-peer-deps

# Run the admin script
node scripts/add-admin.js varunbhole@gmail.com
```

## Accessing the Admin Panel

Once the user has admin privileges:

1. Log in to LaunchPad with the admin email and password
2. Navigate to the admin panel URL: `/dashboard/admin/moderation`
3. The admin panel provides access to:
   - Startup moderation (approve/reject)
   - User management
   - Platform statistics

## Admin Panel Features

The admin panel allows administrators to:

- View all pending startup submissions
- Approve or reject startups
- View recently approved/rejected startups
- See platform statistics

## Default Credentials

For the specific user mentioned (gaurigawade0206@gmail.com):

1. Ask the user to register using the standard registration process
2. Apply admin privileges using the script
3. The user will use their chosen password during registration

## Troubleshooting

If you encounter issues:

1. Make sure the user has already registered
2. Check that your Supabase credentials are correct
3. Verify the roles table exists in your database
4. Ensure the user's profile is properly linked to the correct auth account 