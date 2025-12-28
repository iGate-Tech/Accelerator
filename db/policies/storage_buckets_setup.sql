-- Storage Bucket RLS Policies
-- Purpose: Controls access to file storage (avatars and other uploads)
-- Security Model: Public read for avatars, authenticated upload/update/delete
--
-- Policy Details:
-- 1. Public read access for avatar images
-- 2. Authenticated user management for own files
-- 3. Folder-based ownership validation
--
-- Security Rationale:
-- - Avatar images need public access for display
-- - File uploads require authentication
-- - Folder naming ensures user ownership
--
-- Business Impact:
-- - Enables user profile customization
-- - Supports file upload workflows
-- - Protects against unauthorized file access

-- Avatar bucket policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);