-- Add looking_for column to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS looking_for INTEGER[] DEFAULT array[]::integer[];

-- Migrate data from startup_looking_for junction table to startups table
UPDATE public.startups
SET looking_for = (
  SELECT array_agg(option_id)
  FROM public.startup_looking_for
  WHERE startup_id = startups.id
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_startups_looking_for ON public.startups USING GIN(looking_for);

-- Optional: once you're sure the migration worked, you can drop the old tables
-- DROP TABLE IF EXISTS public.startup_looking_for;
-- DROP TABLE IF EXISTS public.social_links; 