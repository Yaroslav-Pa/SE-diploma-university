-- 1. Add image_urls array to pois table
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- 2. Add image_urls array to comments table
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- 3. Create the storage bucket for poi-images
INSERT INTO storage.buckets (id, name, public) VALUES ('poi-images', 'poi-images', true) ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS on storage.objects if not already enabled
-- (Removed because Supabase already has this enabled and it can cause permission errors)

-- 5. Create Storage Policies for 'poi-images' bucket
-- Allow public access to view images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'poi-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'poi-images' AND auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'poi-images' AND auth.uid() = owner
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (
  bucket_id = 'poi-images' AND auth.uid() = owner
);
