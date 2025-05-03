# Database Consolidation

This directory contains scripts for consolidating all startup-related tables into the main `startups` table.

## Migration Steps

1. Simplified Database Structure
   - Social links (previously in `social_links` table) are now stored directly in `startups.linkedin_url` and `startups.twitter_url`
   - Looking for options (previously in `startup_looking_for` junction table) are now stored in `startups.looking_for` as INTEGER[] array
   - Media (previously in `startup_media` table) are now stored in `startups.media_images`, `startups.media_documents`, and `startups.media_videos` as TEXT[] arrays

2. Migration Process
   - SQL migrations are in the `supabase/migrations` directory
   - JavaScript migration scripts are in the `scripts` directory
   - Each migration adds the new columns and transfers data from the old tables

3. Migration Order
   - Run `20240513_simplify_looking_for.sql` then `scripts/migrate_looking_for.js`
   - Run `20240514_merge_startup_media.sql` then `scripts/migrate_startup_media.js`
   - After confirming all data has been migrated successfully, run `20240515_finalize_startup_table_merge.sql` to drop the old tables

## Benefits of Consolidation

- Simpler codebase with fewer database operations
- More direct data access patterns
- Better performance with fewer joins
- Improved reliability for saving and retrieving startup data

## Final Database Structure

The `startups` table now contains all data directly:

```sql
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  
  -- Added social links (previously in social_links table)
  linkedin_url TEXT,
  twitter_url TEXT,
  
  -- Added looking_for options (previously in startup_looking_for junction table)
  looking_for INTEGER[] DEFAULT array[]::integer[],
  
  -- Added media (previously in startup_media table)
  media_images TEXT[] DEFAULT array[]::text[],
  media_documents TEXT[] DEFAULT array[]::text[],
  media_videos TEXT[] DEFAULT array[]::text[],
  
  -- Original fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- ... other existing fields
);
``` 