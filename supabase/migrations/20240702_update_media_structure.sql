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