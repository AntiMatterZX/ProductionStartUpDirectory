-- Add media arrays to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS media_images TEXT[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS media_documents TEXT[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS media_videos TEXT[] DEFAULT array[]::text[];

-- Migrate image data from startup_media table
UPDATE public.startups
SET media_images = (
  SELECT array_agg(url)
  FROM public.startup_media
  WHERE startup_id = startups.id AND media_type = 'image'
);

-- Migrate document data from startup_media table
UPDATE public.startups
SET media_documents = (
  SELECT array_agg(url)
  FROM public.startup_media
  WHERE startup_id = startups.id AND media_type = 'document'
);

-- Migrate video data from startup_media table
UPDATE public.startups
SET media_videos = (
  SELECT array_agg(url)
  FROM public.startup_media
  WHERE startup_id = startups.id AND media_type = 'video'
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_startups_media_images ON public.startups USING GIN(media_images);
CREATE INDEX IF NOT EXISTS idx_startups_media_documents ON public.startups USING GIN(media_documents);
CREATE INDEX IF NOT EXISTS idx_startups_media_videos ON public.startups USING GIN(media_videos);

-- Optional: once you're sure the migration worked, you can drop the old table
-- DROP TABLE IF EXISTS public.startup_media; 