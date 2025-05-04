#!/usr/bin/env node

// Script to create the users table in Supabase

console.log('To create the users table in your Supabase database:');
console.log('');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Click on "SQL Editor" in the left sidebar');
console.log('3. Create a new query');
console.log('4. Copy and paste the following SQL:');
console.log('');
console.log(`-----------------------------------------------------------------`);
console.log(`
-- Create the users table to extend auth.users with additional fields
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing basic user profiles (anyone can view)
CREATE POLICY "Anyone can view basic user profile info" 
ON public.users FOR SELECT 
USING (true);

-- Create policy for users updating their own profiles
CREATE POLICY "Users can update their own profiles" 
ON public.users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create function to create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set your own email as admin (replace 'your-email@example.com' with your actual email)
INSERT INTO public.users (id, email, is_admin)
SELECT 
  id, 
  email, 
  true 
FROM 
  auth.users 
WHERE 
  email = 'your-email@example.com'
ON CONFLICT (id) 
DO UPDATE SET is_admin = true, updated_at = now();
`);
console.log(`-----------------------------------------------------------------`);
console.log('');
console.log('5. Click "Run" to execute the SQL and create the table');
console.log('');
console.log('**IMPORTANT**: Before running the query, replace "your-email@example.com" with your actual email to make yourself an admin.');
console.log(''); 