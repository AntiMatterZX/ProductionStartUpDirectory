-- Create the required storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('startups', 'startups', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('users', 'users', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES 
    ('public', 'public', true, false, 5242880, '{image/png,image/jpeg,image/gif,image/webp,application/pdf}')
ON CONFLICT (id) DO NOTHING;

-- Create or replace RLS policies for startups bucket
-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'startups' AND 
        (storage.foldername(name))[1] = 'startups' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to update files in their own folder
CREATE POLICY "Users can update files in their own folder" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'startups' AND 
        (storage.foldername(name))[1] = 'startups' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to delete files in their own folder
CREATE POLICY "Users can delete files in their own folder" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'startups' AND 
        (storage.foldername(name))[1] = 'startups' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow public read access to all files in startups bucket
CREATE POLICY "Public read access for startups" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'startups'
    );

-- Create or replace RLS policies for users bucket
-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload profile pictures" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'users' AND 
        (storage.foldername(name))[1] = 'users' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to update files in their own folder
CREATE POLICY "Users can update profile pictures" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'users' AND 
        (storage.foldername(name))[1] = 'users' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow users to delete files in their own folder
CREATE POLICY "Users can delete profile pictures" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'users' AND 
        (storage.foldername(name))[1] = 'users' AND 
        (storage.foldername(name))[2] = auth.uid()::text
    );

-- Allow public read access to all files in users bucket
CREATE POLICY "Public read access for users" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'users'
    );

-- Public bucket policies
-- Allow authenticated users to upload to public bucket
CREATE POLICY "Authenticated users can upload to public bucket" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'public'
    );

-- Allow public read access to all files in public bucket
CREATE POLICY "Public read access for public bucket" ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'public'
    ); 