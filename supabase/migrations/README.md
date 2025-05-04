# Database Migrations

This directory contains SQL migration files that are used to evolve the database schema over time. These migrations are designed to be executed in order (they are prefixed with dates).

## Running Migrations

There are several ways to apply these migrations to your Supabase database:

### Method 1: Automated Script (Recommended)

Run the provided Node.js script to automatically apply all migrations:

```bash
node scripts/apply-migrations.js
```

This script requires:
- Node.js installed
- `.env` file with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set

The script will:
1. Check if the special `exec_sql` function exists
2. Create it if needed
3. Run all migrations in order

### Method 2: Manual SQL Execution

If the automated script doesn't work, you can generate a combined SQL file:

```bash
node scripts/manual-migrations.js
```

This will create a `migrations-to-run.sql` file at the project root. You can then:

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of this file
4. Execute the SQL

### Method 3: Individual Migrations

You can also run each migration file individually through the Supabase dashboard:

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Open each migration file in order
4. Copy and paste the contents
5. Execute the SQL

## Important Notes

- Always back up your database before running migrations
- Migrations might fail if they conflict with existing data or schema
- The first migration to run should be `20240630_create_exec_sql_function.sql` to ensure the `exec_sql` function exists

## Media Structure

Recent migrations have updated the database to support:

- `logo_url`: Company logo (displayed throughout the platform)
- `banner_url`: Banner image (displayed at the top of the profile)
- `pitch_deck_url`: Link to the startup's pitch deck

Gallery images are stored in the `media_images` array, and properly categorized in the UI. 