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