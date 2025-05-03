-- Add tagline column to startups table
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS tagline TEXT; 