-- Create a function to insert social links
CREATE OR REPLACE FUNCTION public.insert_social_link(
  p_startup_id UUID,
  p_platform TEXT,
  p_url TEXT
) RETURNS VOID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Generate a UUID for the new social link
  v_id := gen_random_uuid();
  
  -- Insert the social link
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 