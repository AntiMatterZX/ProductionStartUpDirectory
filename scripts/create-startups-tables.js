#!/usr/bin/env node

// Script to create the essential tables in Supabase

console.log('To create the core tables in your Supabase database:');
console.log('');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Create a new query');
console.log('4. Copy and paste the following SQL:');
console.log('');
console.log(`-----------------------------------------------------------------`);
console.log(`
-- Create the main startups table
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  tagline TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  pitch_deck_url TEXT,
  location TEXT,
  founding_date DATE,
  employee_count INTEGER,
  category_id INTEGER,
  funding_stage TEXT,
  funding_amount DECIMAL,
  linkedin_url TEXT,
  twitter_url TEXT,
  media_images TEXT[] DEFAULT '{}',
  media_documents TEXT[] DEFAULT '{}',
  media_videos TEXT[] DEFAULT '{}',
  looking_for INTEGER[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on the startups table
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing published startups
CREATE POLICY "Anyone can view approved startups" 
ON public.startups FOR SELECT 
USING (status = 'approved' OR auth.uid() = user_id);

-- Create policy for users creating their own startups
CREATE POLICY "Users can create their own startups" 
ON public.startups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users updating their own startups
CREATE POLICY "Users can update their own startups" 
ON public.startups FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for users deleting their own startups
CREATE POLICY "Users can delete their own startups" 
ON public.startups FOR DELETE 
USING (auth.uid() = user_id);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT 
USING (true);

-- Create looking_for_options table
CREATE TABLE IF NOT EXISTS public.looking_for_options (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on looking_for_options table
ALTER TABLE public.looking_for_options ENABLE ROW LEVEL SECURITY;

-- Anyone can view looking_for_options
CREATE POLICY "Anyone can view looking_for_options" 
ON public.looking_for_options FOR SELECT 
USING (true);

-- Create startup_views table to track views
CREATE TABLE IF NOT EXISTS public.startup_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on startup_views table
ALTER TABLE public.startup_views ENABLE ROW LEVEL SECURITY;

-- Allow inserts for view tracking
CREATE POLICY "Anyone can record a view" 
ON public.startup_views FOR INSERT 
WITH CHECK (true);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(startup_id, user_id)
);

-- Enable RLS on votes table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Voting policies
CREATE POLICY "Users can vote" 
ON public.votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view votes" 
ON public.votes FOR SELECT 
USING (true);

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sample categories if needed
INSERT INTO public.categories (name, slug)
VALUES 
  ('SaaS', 'saas'),
  ('Fintech', 'fintech'),
  ('Healthcare', 'healthcare'),
  ('E-commerce', 'ecommerce'),
  ('AI/ML', 'ai-ml'),
  ('Education', 'education'),
  ('Energy', 'energy'),
  ('Gaming', 'gaming'),
  ('Blockchain', 'blockchain'),
  ('Hardware', 'hardware')
ON CONFLICT (slug) DO NOTHING;

-- Create sample looking_for options if needed
INSERT INTO public.looking_for_options (name)
VALUES 
  ('Investment'),
  ('Co-founder'),
  ('Employees'),
  ('Partners'),
  ('Advisors'),
  ('Mentors'),
  ('Beta Users')
ON CONFLICT DO NOTHING;
`);
console.log(`-----------------------------------------------------------------`);
console.log('');
console.log('5. Click "Run" to execute the SQL and create the necessary tables');
console.log('');
console.log('This will create the following tables:');
console.log('- startups: The main table for startup listings');
console.log('- categories: Categories for startups');
console.log('- looking_for_options: Options for what startups are looking for');
console.log('- startup_views: Tracks views of startup profiles');
console.log('- votes: Allows users to upvote/downvote startups');
console.log('- audit_log: Tracks changes to startups'); 