-- Migration to copy data from URL fields to image fields
-- This script should be run after updating the code that uses these fields

-- First, copy data from logo_url to logo_image where logo_image is NULL
UPDATE public.startups
SET logo_image = logo_url
WHERE logo_image IS NULL 
  AND logo_url IS NOT NULL;

-- Copy data from banner_url to banner_image where banner_image is NULL
UPDATE public.startups
SET banner_image = banner_url
WHERE banner_image IS NULL 
  AND banner_url IS NOT NULL;

-- Add a note to the startup to indicate the migration was performed
COMMENT ON TABLE public.startups IS 'Startups with migrated image fields from URLs to actual uploaded images';

-- Create a function to facilitate media_images cleanup
CREATE OR REPLACE FUNCTION public.cleanup_media_images()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  startup_record record;
BEGIN
  -- For each startup, ensure media_images doesn't contain duplicates
  FOR startup_record IN
    SELECT id, logo_image, banner_image, media_images
    FROM public.startups
    WHERE array_length(media_images, 1) > 0
  LOOP
    -- Remove duplicates from media_images
    UPDATE public.startups
    SET media_images = ARRAY(
      SELECT DISTINCT unnest(media_images)
      FROM unnest(media_images) AS url
    )
    WHERE id = startup_record.id;
  END LOOP;
END;
$$;

-- Execute the cleanup function
SELECT public.cleanup_media_images();

-- Drop the function after use
DROP FUNCTION IF EXISTS public.cleanup_media_images(); 