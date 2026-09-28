-- =====================================================
-- 018_wishlist_images.sql
-- Add image support to wishlists
-- =====================================================

-- 1. Kolom image_url + image_source
ALTER TABLE public.wishlists
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_source text
    CHECK (image_source IN ('auto', 'manual', NULL));

-- 2. Storage bucket untuk wishlist images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wishlist-images',
  'wishlist-images',
  true,
  5 * 1024 * 1024, -- 5MB max
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies — users cuma bisa akses folder mereka sendiri
-- Path format: {user_id}/{wishlist_id}.{ext}

DROP POLICY IF EXISTS "wishlist_images_public_read" ON storage.objects;
CREATE POLICY "wishlist_images_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'wishlist-images');

DROP POLICY IF EXISTS "wishlist_images_insert_own" ON storage.objects;
CREATE POLICY "wishlist_images_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "wishlist_images_update_own" ON storage.objects;
CREATE POLICY "wishlist_images_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "wishlist_images_delete_own" ON storage.objects;
CREATE POLICY "wishlist_images_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Verify
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'wishlists'
  AND column_name IN ('image_url', 'image_source');

SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'wishlist-images';