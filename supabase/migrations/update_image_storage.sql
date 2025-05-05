-- Migration to update image storage approach from URL strings to actual file uploads
-- This changes the storage approach for logo, banner, and gallery images

-- Rename logo_url to logo_image in startups table
ALTER TABLE public.startups
RENAME COLUMN logo_url TO logo_image;

-- Rename banner_url to banner_image in startups table
ALTER TABLE public.startups
RENAME COLUMN banner_url TO banner_image;

-- Update column comments to better describe their purpose
COMMENT ON COLUMN public.startups.logo_image IS 'Uploaded startup logo image';
COMMENT ON COLUMN public.startups.banner_image IS 'Uploaded banner image displayed at the top of the profile';
COMMENT ON COLUMN public.startups.media_images IS 'Array of gallery images for the startup';

-- If needed, create a new gallery_images array for more explicit separation
-- But for now, we'll continue using media_images as the gallery storage

-- Update the media types in startup_media_items check constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'startup_media_items'
  ) THEN
    -- Modify the media_type check constraint to update terminology
    ALTER TABLE public.startup_media_items
      DROP CONSTRAINT IF EXISTS startup_media_items_media_type_check;
      
    ALTER TABLE public.startup_media_items
      ADD CONSTRAINT startup_media_items_media_type_check
      CHECK (media_type IN ('logo', 'banner', 'gallery', 'image', 'document', 'video'));
  END IF;
END $$;

-- Update indices for better query performance
DROP INDEX IF EXISTS idx_startups_logo_url;
CREATE INDEX IF NOT EXISTS idx_startups_logo_image ON public.startups(logo_image) 
WHERE logo_image IS NOT NULL;

DROP INDEX IF EXISTS idx_startups_banner_url;
CREATE INDEX IF NOT EXISTS idx_startups_banner_image ON public.startups(banner_image) 
WHERE banner_image IS NOT NULL; 