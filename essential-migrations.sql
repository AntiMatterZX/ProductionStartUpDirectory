-- Essential migrations for media separation feature

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

-- Add banner_url column to startups table if it doesn't exist
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