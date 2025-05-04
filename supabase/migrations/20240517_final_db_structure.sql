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