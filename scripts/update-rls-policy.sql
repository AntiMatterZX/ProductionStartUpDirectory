-- Update Row Level Security policies for social_links table

-- Drop existing policies on social_links table
DROP POLICY IF EXISTS "Social links can be updated by startup owner" ON public.social_links;
DROP POLICY IF EXISTS "Social links are viewable by everyone" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be inserted by startup owner" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be deleted by startup owner" ON public.social_links;

-- Create policies for different operations
-- 1. Select policy - anyone can view social links
CREATE POLICY "Social links are viewable by everyone" 
ON public.social_links FOR SELECT 
USING (true);

-- 2. Insert policy - users can insert social links for startups they own
CREATE POLICY "Social links can be inserted by startup owner" 
ON public.social_links FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- 3. Update policy - users can update social links for startups they own
CREATE POLICY "Social links can be updated by startup owner" 
ON public.social_links FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- 4. Delete policy - users can delete social links for startups they own
CREATE POLICY "Social links can be deleted by startup owner" 
ON public.social_links FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Ensure RLS is enabled on the table
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY; 