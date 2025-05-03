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