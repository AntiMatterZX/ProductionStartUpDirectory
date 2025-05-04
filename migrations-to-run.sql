-- Combined migration script for manual execution in Supabase Studio
-- Generated on 2025-05-04T18:30:02.583Z
-- Run this file in the Supabase Studio SQL Editor

-- First creating exec_sql function to support automated migrations in the future
-- Migration to add exec_sql function to the database
-- This function allows executing arbitrary SQL commands from migrations

-- Create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execution privileges to authorized roles
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO postgres;

-- Add comment explaining function purpose
COMMENT ON FUNCTION public.exec_sql(text) IS 'Function to execute arbitrary SQL statements. Used by migration scripts.'; 


-- ========================================
-- Migration: 20240505_storage_buckets.sql
-- ========================================

-- Create the required storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('startups', 'startups', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('users', 'users', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('public', 'public', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp,application/pdf}')
ON CONFLICT (id) DO NOTHING;

-- Create or replace RLS policies for startups bucket
-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'startups' AND 
        (storage.foldername(name))[1] = 'startups' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to update files in their own folder
CREATE POLICY "Users can update files in their own folder" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'startups' AND 
        (storage.foldername(name))[1] = 'startups' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to delete files in their own folder
CREATE POLICY "Users can delete files in their own folder" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'startups' AND 
        (storage.foldername(name))[1] = 'startups' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow public read access to all files in startups bucket
CREATE POLICY "Public read access for startups" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'startups'
    );

-- Create or replace RLS policies for users bucket
-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload profile pictures" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'users' AND 
        (storage.foldername(name))[1] = 'users' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to update files in their own folder
CREATE POLICY "Users can update profile pictures" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'users' AND 
        (storage.foldername(name))[1] = 'users' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to delete files in their own folder
CREATE POLICY "Users can delete profile pictures" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'users' AND 
        (storage.foldername(name))[1] = 'users' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow public read access to all files in users bucket
CREATE POLICY "Public read access for users" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'users'
    );

-- Public bucket policies
-- Allow authenticated users to upload to public bucket
CREATE POLICY "Authenticated users can upload to public bucket" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'public'
    );

-- Allow public read access to all files in public bucket
CREATE POLICY "Public read access for public bucket" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'public'
    ); 

-- ========================================
-- Migration: 20240510_add_tagline_to_startups.sql
-- ========================================

-- Add tagline column to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS tagline TEXT; 

-- ========================================
-- Migration: 20240511_create_insert_social_link_function.sql
-- ========================================

-- Create a function to insert social links
CREATE OR REPLACE FUNCTION public.insert_social_link(
  p_startup_id UUID,
  p_platform TEXT,
  p_url TEXT
) RETURNS VOID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Generate a UUID for the new social link
  v_id := gen_random_uuid();
  
  -- Insert the social link
  INSERT INTO public.social_links (
    id,
    startup_id,
    platform,
    url,
    created_at,
    updated_at
  ) VALUES (
    v_id,
    p_startup_id,
    p_platform,
    p_url,
    NOW(),
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- ========================================
-- Migration: 20240511_fix_social_links_rls.sql
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Social links can be updated by startup owner" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be inserted by startup owner" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be viewed by anyone" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be deleted by startup owner" ON public.social_links;

-- Enable RLS on social_links table if not already enabled
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing social links (anyone can view)
CREATE POLICY "Social links can be viewed by anyone" 
ON public.social_links FOR SELECT 
USING (true);

-- Create policy for inserting social links (only startup owners can insert)
CREATE POLICY "Social links can be inserted by startup owner" 
ON public.social_links FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Create policy for updating social links (only startup owners can update)
CREATE POLICY "Social links can be updated by startup owner" 
ON public.social_links FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Create policy for deleting social links (only startup owners can delete)
CREATE POLICY "Social links can be deleted by startup owner" 
ON public.social_links FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Create or replace the insert_social_link function to handle permission issues
CREATE OR REPLACE FUNCTION public.insert_social_link(
  p_startup_id UUID,
  p_platform TEXT,
  p_url TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_startup_user_id UUID;
BEGIN
  -- Generate a UUID for the new social link
  v_id := gen_random_uuid();
  
  -- Insert the social link using an ADMIN role to bypass RLS
  INSERT INTO public.social_links (
    id,
    startup_id,
    platform,
    url,
    created_at,
    updated_at
  ) VALUES (
    v_id,
    p_startup_id,
    p_platform,
    p_url,
    NOW(),
    NOW()
  );
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- ========================================
-- Migration: 20240512_simplify_social_links.sql
-- ========================================

-- Add LinkedIn and Twitter URL columns directly to startups table
ALTER TABLE public.startups 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Migrate data from social_links table to startups table
UPDATE public.startups
SET 
  linkedin_url = (
    SELECT url FROM public.social_links 
    WHERE startup_id = startups.id AND platform = 'linkedin'
    LIMIT 1
  ),
  twitter_url = (
    SELECT url FROM public.social_links 
    WHERE startup_id = startups.id AND platform = 'twitter'
    LIMIT 1
  );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_startups_linkedin_url ON public.startups(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startups_twitter_url ON public.startups(twitter_url) WHERE twitter_url IS NOT NULL; 

-- ========================================
-- Migration: 20240513_simplify_looking_for.sql
-- ========================================

-- Add looking_for column to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS looking_for INTEGER[] DEFAULT array[]::integer[];

-- Migrate data from startup_looking_for junction table to startups table
UPDATE public.startups
SET looking_for = (
  SELECT array_agg(option_id)
  FROM public.startup_looking_for
  WHERE startup_id = startups.id
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_startups_looking_for ON public.startups USING GIN(looking_for);

-- Optional: once you're sure the migration worked, you can drop the old tables
-- DROP TABLE IF EXISTS public.startup_looking_for;
-- DROP TABLE IF EXISTS public.social_links; 

-- ========================================
-- Migration: 20240514_merge_startup_media.sql
-- ========================================

-- Add media arrays to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS media_images TEXT[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS media_documents TEXT[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS media_videos TEXT[] DEFAULT array[]::text[];

-- Migrate image data from startup_media table
UPDATE public.startups
SET media_images = (
  SELECT array_agg(url)
  FROM public.startup_media
  WHERE startup_id = startups.id AND media_type = 'image'
);

-- Migrate document data from startup_media table
UPDATE public.startups
SET media_documents = (
  SELECT array_agg(url)
  FROM public.startup_media
  WHERE startup_id = startups.id AND media_type = 'document'
);

-- Migrate video data from startup_media table
UPDATE public.startups
SET media_videos = (
  SELECT array_agg(url)
  FROM public.startup_media
  WHERE startup_id = startups.id AND media_type = 'video'
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_startups_media_images ON public.startups USING GIN(media_images);
CREATE INDEX IF NOT EXISTS idx_startups_media_documents ON public.startups USING GIN(media_documents);
CREATE INDEX IF NOT EXISTS idx_startups_media_videos ON public.startups USING GIN(media_videos);

-- Optional: once you're sure the migration worked, you can drop the old table
-- DROP TABLE IF EXISTS public.startup_media; 

-- ========================================
-- Migration: 20240515_finalize_startup_table_merge.sql
-- ========================================

-- This script drops all tables that have been merged into the startups table
-- Only run this after confirming all migrations were successful

-- Drop the social links junction table
DROP TABLE IF EXISTS public.social_links;

-- Drop the looking_for junction table
DROP TABLE IF EXISTS public.startup_looking_for;

-- Drop the media table
DROP TABLE IF EXISTS public.startup_media;

-- Add a comment to the startups table to document the merged structure
COMMENT ON TABLE public.startups IS 'Main startups table with all data consolidated. Contains social links (linkedin_url, twitter_url), looking_for options (looking_for array), and media (media_images, media_documents, media_videos arrays).'; 

-- ========================================
-- Migration: 20240516_update_startup_indexes.sql
-- ========================================

-- Add specific columns for common media types to make them easier to reference directly
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS logo_media_url TEXT,
ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT;

-- Update the values if they exist in media arrays
UPDATE public.startups
SET logo_media_url = (
  SELECT media_images[1]
  FROM public.startups s
  WHERE s.id = startups.id AND array_length(s.media_images, 1) > 0
)
WHERE logo_media_url IS NULL;

-- Create separate logo_url as a convenience
UPDATE public.startups
SET logo_url = logo_media_url
WHERE logo_url IS NULL AND logo_media_url IS NOT NULL;

-- Get first document and set as pitch deck if available
UPDATE public.startups
SET pitch_deck_url = (
  SELECT media_documents[1]
  FROM public.startups s
  WHERE s.id = startups.id AND array_length(s.media_documents, 1) > 0
)
WHERE pitch_deck_url IS NULL;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN public.startups.logo_media_url IS 'Primary logo URL from media_images array for easy reference';
COMMENT ON COLUMN public.startups.logo_url IS 'Main startup logo used for display throughout the platform';
COMMENT ON COLUMN public.startups.pitch_deck_url IS 'URL to the startup pitch deck document from media_documents array';

-- Create the appropriate indexes
CREATE INDEX IF NOT EXISTS idx_startups_logo_url ON public.startups (logo_url)
WHERE logo_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_startups_pitch_deck_url ON public.startups (pitch_deck_url)
WHERE pitch_deck_url IS NOT NULL; 

-- ========================================
-- Migration: 20240517_final_db_structure.sql
-- ========================================

-- This script documents the final database structure after consolidation
-- It can be run to recreate the database structure from scratch

-- Make sure extensions are loaded
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Main startups table with all consolidated data
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT NOT NULL,
  
  -- Basic info
  website_url TEXT,
  founding_date DATE,
  employee_count INTEGER,
  funding_stage TEXT,
  funding_amount NUMERIC,
  location TEXT,
  category_id INTEGER REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Added social links (previously in social_links table)
  linkedin_url TEXT,
  twitter_url TEXT,
  
  -- Added looking for options (previously in startup_looking_for junction table)
  looking_for INTEGER[] DEFAULT array[]::integer[],
  
  -- Improved media storage with metadata
  -- Media arrays with URLs
  media_images TEXT[] DEFAULT array[]::text[],
  media_documents TEXT[] DEFAULT array[]::text[],
  media_videos TEXT[] DEFAULT array[]::text[],
  
  -- JSON metadata for each media item to enable better organization
  media_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Special media fields for convenience
  logo_url TEXT,
  logo_media_url TEXT,
  cover_image_url TEXT,
  pitch_deck_url TEXT,
  featured_video_url TEXT,
  
  -- Media counts for quick access without array length queries
  image_count INTEGER DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  
  -- Last media update timestamp for caching purposes
  last_media_update TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Full-text search column
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || 
    coalesce(tagline, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(location, ''))
  ) STORED
);

-- Categories reference table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Looking for options reference table
CREATE TABLE IF NOT EXISTS public.looking_for_options (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a dedicated startup_media table for better organization and queryability
CREATE TABLE IF NOT EXISTS public.startup_media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('logo', 'image', 'document', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT,
  bucket TEXT,
  filename TEXT,
  title TEXT,
  description TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_startups_user_id ON public.startups(user_id);
CREATE INDEX IF NOT EXISTS idx_startups_category_id ON public.startups(category_id);
CREATE INDEX IF NOT EXISTS idx_startups_search_vector ON public.startups USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_startups_looking_for ON public.startups USING GIN(looking_for);
CREATE INDEX IF NOT EXISTS idx_startups_media_images ON public.startups USING GIN(media_images);
CREATE INDEX IF NOT EXISTS idx_startups_media_documents ON public.startups USING GIN(media_documents);
CREATE INDEX IF NOT EXISTS idx_startups_media_videos ON public.startups USING GIN(media_videos);
CREATE INDEX IF NOT EXISTS idx_startups_media_metadata ON public.startups USING GIN(media_metadata);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_startup_id ON public.startup_media_items(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_user_id ON public.startup_media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_media_type ON public.startup_media_items(media_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON public.audit_log(entity_id);

-- Add comments to document tables and columns
COMMENT ON TABLE public.startups IS 'Main startup table with all data consolidated';
COMMENT ON COLUMN public.startups.looking_for IS 'Array of looking_for_options IDs that were previously in a junction table';
COMMENT ON COLUMN public.startups.media_images IS 'Array of image URLs that were previously in the startup_media table';
COMMENT ON COLUMN public.startups.media_documents IS 'Array of document URLs that were previously in the startup_media table';
COMMENT ON COLUMN public.startups.media_videos IS 'Array of video URLs that were previously in the startup_media table';
COMMENT ON COLUMN public.startups.media_metadata IS 'JSON metadata for media items containing information like filename, size, etc.';
COMMENT ON COLUMN public.startups.logo_url IS 'Main startup logo URL used for display throughout the platform';
COMMENT ON COLUMN public.startups.logo_media_url IS 'URL to the logo image in media storage system';
COMMENT ON COLUMN public.startups.cover_image_url IS 'URL to the primary cover image for the startup';
COMMENT ON COLUMN public.startups.pitch_deck_url IS 'URL to the startup pitch deck document';
COMMENT ON COLUMN public.startups.featured_video_url IS 'URL to the featured video for the startup';
COMMENT ON TABLE public.startup_media_items IS 'Dedicated table for startup media items with detailed metadata';

-- Create triggers to keep media counts in sync
CREATE OR REPLACE FUNCTION update_media_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.image_count = array_length(NEW.media_images, 1);
    NEW.document_count = array_length(NEW.media_documents, 1);
    NEW.video_count = array_length(NEW.media_videos, 1);
    NEW.last_media_update = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_counts_trigger
BEFORE UPDATE ON public.startups
FOR EACH ROW
WHEN (OLD.media_images IS DISTINCT FROM NEW.media_images OR 
      OLD.media_documents IS DISTINCT FROM NEW.media_documents OR 
      OLD.media_videos IS DISTINCT FROM NEW.media_videos)
EXECUTE FUNCTION update_media_counts(); 

-- ========================================
-- Migration: 20240606_fix_startup_media_arrays.sql
-- ========================================

-- Fix for startup media arrays to ensure they're properly initialized
-- This prevents "Failed to fetch current media data" errors

-- Ensure media_images is an array and not null
UPDATE public.startups
SET media_images = '{}'::text[]
WHERE media_images IS NULL;

-- Ensure media_documents is an array and not null
UPDATE public.startups
SET media_documents = '{}'::text[]
WHERE media_documents IS NULL;

-- Ensure media_videos is an array and not null
UPDATE public.startups
SET media_videos = '{}'::text[]
WHERE media_videos IS NULL;

-- Add constraints to prevent nulls in these columns in the future
ALTER TABLE public.startups
  ALTER COLUMN media_images SET DEFAULT '{}'::text[],
  ALTER COLUMN media_documents SET DEFAULT '{}'::text[],
  ALTER COLUMN media_videos SET DEFAULT '{}'::text[];

-- Add NOT NULL constraints after fixing existing data
ALTER TABLE public.startups
  ALTER COLUMN media_images SET NOT NULL,
  ALTER COLUMN media_documents SET NOT NULL,
  ALTER COLUMN media_videos SET NOT NULL;

-- Ensure the startup_media_items table exists
CREATE TABLE IF NOT EXISTS public.startup_media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('logo', 'image', 'document', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT,
  bucket TEXT,
  filename TEXT,
  title TEXT,
  description TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_startup_media_items_startup_id ON public.startup_media_items(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_user_id ON public.startup_media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_media_type ON public.startup_media_items(media_type);

-- ========================================
-- Migration: 20240606_media_structure_update.sql
-- ========================================

-- Migration to update the media structure for better scalability and organization

-- Add new media-related columns to startups table
ALTER TABLE public.startups 
ADD COLUMN IF NOT EXISTS media_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS featured_video_url TEXT,
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_media_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a dedicated startup_media_items table for better organization and queryability
CREATE TABLE IF NOT EXISTS public.startup_media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('logo', 'image', 'document', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT,
  bucket TEXT,
  filename TEXT,
  title TEXT,
  description TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for the new table
CREATE INDEX IF NOT EXISTS idx_startups_media_metadata ON public.startups USING GIN(media_metadata);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_startup_id ON public.startup_media_items(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_user_id ON public.startup_media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_media_items_media_type ON public.startup_media_items(media_type);

-- Add comments to document new columns and tables
COMMENT ON COLUMN public.startups.media_metadata IS 'JSON metadata for media items containing information like filename, size, etc.';
COMMENT ON COLUMN public.startups.cover_image_url IS 'URL to the primary cover image for the startup';
COMMENT ON COLUMN public.startups.featured_video_url IS 'URL to the featured video for the startup';
COMMENT ON TABLE public.startup_media_items IS 'Dedicated table for startup media items with detailed metadata';

-- Update media counts for existing startups
UPDATE public.startups
SET 
  image_count = COALESCE(array_length(media_images, 1), 0),
  document_count = COALESCE(array_length(media_documents, 1), 0),
  video_count = COALESCE(array_length(media_videos, 1), 0),
  last_media_update = now();

-- Migrate existing media items to the new table
-- First logos
INSERT INTO public.startup_media_items (
  startup_id, 
  user_id, 
  media_type, 
  url, 
  title,
  is_featured
)
SELECT 
  id as startup_id, 
  user_id, 
  'logo' as media_type, 
  logo_url as url, 
  'Logo' as title,
  true as is_featured
FROM public.startups
WHERE logo_url IS NOT NULL;

-- Then images
INSERT INTO public.startup_media_items (
  startup_id, 
  user_id, 
  media_type, 
  url, 
  title,
  is_featured
)
SELECT 
  s.id as startup_id, 
  s.user_id, 
  'image' as media_type, 
  unnest(s.media_images) as url, 
  'Image' as title,
  false as is_featured
FROM public.startups s
WHERE array_length(s.media_images, 1) > 0
AND s.media_images IS NOT NULL;

-- Then documents
INSERT INTO public.startup_media_items (
  startup_id, 
  user_id, 
  media_type, 
  url, 
  title,
  is_featured
)
SELECT 
  s.id as startup_id, 
  s.user_id, 
  'document' as media_type, 
  unnest(s.media_documents) as url, 
  'Document' as title,
  (CASE WHEN unnest(s.media_documents) = s.pitch_deck_url THEN true ELSE false END) as is_featured
FROM public.startups s
WHERE array_length(s.media_documents, 1) > 0
AND s.media_documents IS NOT NULL;

-- Then videos
INSERT INTO public.startup_media_items (
  startup_id, 
  user_id, 
  media_type, 
  url, 
  title,
  is_featured
)
SELECT 
  s.id as startup_id, 
  s.user_id, 
  'video' as media_type, 
  unnest(s.media_videos) as url, 
  'Video' as title,
  false as is_featured
FROM public.startups s
WHERE array_length(s.media_videos, 1) > 0
AND s.media_videos IS NOT NULL;

-- Create triggers to keep media counts in sync
CREATE OR REPLACE FUNCTION update_media_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.image_count = COALESCE(array_length(NEW.media_images, 1), 0);
    NEW.document_count = COALESCE(array_length(NEW.media_documents, 1), 0);
    NEW.video_count = COALESCE(array_length(NEW.media_videos, 1), 0);
    NEW.last_media_update = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_counts_trigger
BEFORE UPDATE ON public.startups
FOR EACH ROW
WHEN (OLD.media_images IS DISTINCT FROM NEW.media_images OR 
      OLD.media_documents IS DISTINCT FROM NEW.media_documents OR 
      OLD.media_videos IS DISTINCT FROM NEW.media_videos)
EXECUTE FUNCTION update_media_counts(); 

-- ========================================
-- Migration: 20240630_add_banner_url.sql
-- ========================================

-- Migration to add banner_url column to startups table
-- This separates the logo, banner, and gallery images for better organization

-- Add banner_url column to store the primary banner image URL
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Comment explaining the purpose of this column
COMMENT ON COLUMN public.startups.banner_url IS 'URL to the startup banner image that appears at the top of the profile page';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_startups_banner_url ON public.startups (banner_url)
WHERE banner_url IS NOT NULL;

-- If this column doesn't already exist, attempt to populate banner_url from media_images
-- This will try to set the first media image as the banner if it isn't already the logo
UPDATE public.startups
SET banner_url = (
  SELECT media_images[1]
  FROM public.startups s
  WHERE s.id = startups.id 
    AND array_length(s.media_images, 1) > 0
    AND (media_images[1] != logo_url OR logo_url IS NULL)
)
WHERE banner_url IS NULL; 

-- ========================================
-- Migration: 20240702_update_media_structure.sql
-- ========================================

-- Migration to update startup media structure for logo, banner, and gallery
-- This ensures proper database support for the UI changes

-- Add banner_url column to startups table if it doesn't exist
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comments to explain the purpose of each column
COMMENT ON COLUMN public.startups.logo_url IS 'URL to the company logo image';
COMMENT ON COLUMN public.startups.banner_url IS 'URL to the banner image displayed at the top of the profile';
COMMENT ON COLUMN public.startups.pitch_deck_url IS 'URL to the startup pitch deck document';

-- Create an index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_startups_banner_url ON public.startups(banner_url) 
WHERE banner_url IS NOT NULL;

-- If needed, attempt to migrate existing data where we have images but no banner set
UPDATE public.startups
SET banner_url = (
  SELECT media_images[1]
  FROM public.startups s2
  WHERE s2.id = startups.id
    AND array_length(s2.media_images, 1) > 0
    AND (s2.media_images[1] != s2.logo_url OR s2.logo_url IS NULL)
    AND s2.banner_url IS NULL
)
WHERE banner_url IS NULL
  AND array_length(media_images, 1) > 0;

-- Update the startup_media_items table (if it exists) to add support for the banner type
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'startup_media_items'
  ) THEN
    -- Modify the media_type check constraint to include 'banner' and 'gallery'
    ALTER TABLE public.startup_media_items
      DROP CONSTRAINT IF EXISTS startup_media_items_media_type_check;
      
    ALTER TABLE public.startup_media_items
      ADD CONSTRAINT startup_media_items_media_type_check
      CHECK (media_type IN ('logo', 'banner', 'gallery', 'image', 'document', 'video'));
  END IF;
END $$; 

-- ========================================
-- Migration: manual-setup.sql
-- ========================================

-- Manual database setup script for Supabase Studio
-- Use this if the automated scripts aren't working

-- First add the banner_url column to startups table if it doesn't exist
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comments to explain the purpose of each column
COMMENT ON COLUMN public.startups.logo_url IS 'URL to the company logo image';
COMMENT ON COLUMN public.startups.banner_url IS 'URL to the banner image displayed at the top of the profile';
COMMENT ON COLUMN public.startups.pitch_deck_url IS 'URL to the startup pitch deck document';

-- Create indices for better query performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_startups_logo_url ON public.startups(logo_url) 
WHERE logo_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_startups_banner_url ON public.startups(banner_url) 
WHERE banner_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_startups_pitch_deck_url ON public.startups(pitch_deck_url) 
WHERE pitch_deck_url IS NOT NULL;

-- If needed, attempt to migrate existing data where we have images but no banner set
UPDATE public.startups
SET banner_url = (
  SELECT media_images[1]
  FROM public.startups s2
  WHERE s2.id = startups.id
    AND array_length(s2.media_images, 1) > 0
    AND (s2.media_images[1] != s2.logo_url OR s2.logo_url IS NULL)
    AND s2.banner_url IS NULL
)
WHERE banner_url IS NULL
  AND array_length(media_images, 1) > 0;

-- Function to execute SQL (for future migrations)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execution privileges to authorized roles
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO postgres;

-- Add comment explaining function purpose
COMMENT ON FUNCTION public.exec_sql(text) IS 'Function to execute arbitrary SQL statements. Used by migration scripts.'; 
