-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Social links can be updated by startup owner" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be inserted by startup owner" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be viewed by anyone" ON public.social_links;
DROP POLICY IF EXISTS "Social links can be deleted by startup owner" ON public.social_links;

-- Enable RLS on social_links table if not already enabled
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing social links (anyone can view)
CREATE POLICY "Social links can be viewed by anyone" 
ON public.social_links FOR SELECT 
USING (true);

-- Create policy for inserting social links (only startup owners can insert)
CREATE POLICY "Social links can be inserted by startup owner" 
ON public.social_links FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Create policy for updating social links (only startup owners can update)
CREATE POLICY "Social links can be updated by startup owner" 
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
CREATE POLICY "Social links can be deleted by startup owner" 
ON public.social_links FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.startups 
    WHERE startups.id = social_links.startup_id 
    AND startups.user_id = auth.uid()
  )
);

-- Create or replace the insert_social_link function to handle permission issues
CREATE OR REPLACE FUNCTION public.insert_social_link(
  p_startup_id UUID,
  p_platform TEXT,
  p_url TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_startup_user_id UUID;
BEGIN
  -- Generate a UUID for the new social link
  v_id := gen_random_uuid();
  
  -- Insert the social link using an ADMIN role to bypass RLS
  INSERT INTO public.social_links (
    id,
    startup_id,
    platform,
    url,
    created_at,
    updated_at
  ) VALUES (
    v_id,
    p_startup_id,
    p_platform,
    p_url,
    NOW(),
    NOW()
  );
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 