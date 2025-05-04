#!/usr/bin/env node

// Script to create the social_links table in Supabase - outputs SQL to run manually

console.log('To create the social_links table in your Supabase database:');
console.log('');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Create a new query');
console.log('4. Copy and paste the following SQL:');
console.log('');
console.log(`-----------------------------------------------------------------`);
console.log(`
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing social links (anyone can view)
CREATE POLICY IF NOT EXISTS "Social links can be viewed by anyone" 
ON public.social_links FOR SELECT 
USING (true);

-- Create policy for inserting social links (only startup owners can insert)
CREATE POLICY IF NOT EXISTS "Social links can be inserted by startup owner" 
ON public.social_links FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Create policy for updating social links (only startup owners can update)
CREATE POLICY IF NOT EXISTS "Social links can be updated by startup owner" 
ON public.social_links FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Create policy for deleting social links (only startup owners can delete)
CREATE POLICY IF NOT EXISTS "Social links can be deleted by startup owner" 
ON public.social_links FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);
`);
console.log(`-----------------------------------------------------------------`);
console.log('');
console.log('5. Click "Run" to execute the SQL and create the table');
console.log('');
console.log('Alternatively, you can use the Supabase UI to create this table:');
console.log('1. Go to "Table Editor" in the left sidebar');
console.log('2. Click "Create a new table"');
console.log('3. Name it "social_links"');
console.log('4. Add the columns: id (UUID), startup_id (UUID), platform (text), url (text), created_at (timestamp), updated_at (timestamp)');
console.log('5. Set appropriate RLS policies as shown in the SQL above'); 