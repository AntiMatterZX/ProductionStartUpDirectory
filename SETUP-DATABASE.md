# Database Setup Instructions

The application has been updated to support separate logo, banner, and gallery images. However, this requires database modifications to work properly. Please follow these instructions to update your database.

## Option 1: Automated Setup (Requires Environment Variables)

1. Make sure you have your Supabase credentials in your `.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the automated migration script:
   ```
   node scripts/apply-migrations.js
   ```

3. If successful, your database is ready to go!

## Option 2: Manual SQL Execution

If the automated script fails with an error about `exec_sql` function not existing, please follow these steps:

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to the SQL Editor
4. Copy the entire contents of `supabase/migrations/manual-setup.sql`
5. Paste into the SQL Editor
6. Click "Run" to execute the SQL

This will:
- Add the `banner_url` column to the startups table
- Create appropriate indexes
- Set up the `exec_sql` function for future migrations

## Verifying the Setup

Once the database has been updated, you should see:

1. A new "Banner Image" section in the startup editor
2. Logo, banner, and gallery images properly separated in the UI
3. The ability to upload each type of image separately

## Troubleshooting

If you encounter any issues:

- Check the Supabase console for error messages
- Ensure your database credentials are correct
- Try running the manual SQL script directly
- Check if the `exec_sql` function exists in your database by running:
  ```sql
  SELECT * FROM pg_proc WHERE proname = 'exec_sql';
  ```

If you need additional help, please contact the development team. 