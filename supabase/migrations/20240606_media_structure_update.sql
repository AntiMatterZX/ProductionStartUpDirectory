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