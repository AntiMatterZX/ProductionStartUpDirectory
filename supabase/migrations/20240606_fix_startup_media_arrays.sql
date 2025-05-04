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
CREATE INDEX IF NOT EXISTS idx_startup_media_items_media_type ON public.startup_media_items(media_type); x`