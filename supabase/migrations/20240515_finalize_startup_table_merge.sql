-- This script drops all tables that have been merged into the startups table
-- Only run this after confirming all migrations were successful

-- Drop the social links junction table
DROP TABLE IF EXISTS public.social_links;

-- Drop the looking_for junction table
DROP TABLE IF EXISTS public.startup_looking_for;

-- Drop the media table
DROP TABLE IF EXISTS public.startup_media;

-- Add a comment to the startups table to document the merged structure
COMMENT ON TABLE public.startups IS 'Main startups table with all data consolidated. Contains social links (linkedin_url, twitter_url), looking_for options (looking_for array), and media (media_images, media_documents, media_videos arrays).'; 