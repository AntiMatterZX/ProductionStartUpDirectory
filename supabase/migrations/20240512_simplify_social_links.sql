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