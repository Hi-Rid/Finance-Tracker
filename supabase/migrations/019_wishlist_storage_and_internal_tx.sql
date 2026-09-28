-- =====================================================
-- 019_wishlist_storage_and_internal_tx.sql
-- Fix storage bucket + tambah is_internal fields untuk envelope
-- =====================================================

-- =====================================================
-- SECTION 1: FIX STORAGE BUCKET
-- =====================================================

-- Recreate bucket dengan config bener
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wishlist-images',
  'wishlist-images',
  true,
  3 * 1024 * 1024,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3 * 1024 * 1024,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Drop + recreate policies
DROP POLICY IF EXISTS "wishlist_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "wishlist_images_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "wishlist_images_update_own" ON storage.objects;
DROP POLICY IF EXISTS "wishlist_images_delete_own" ON storage.objects;

-- Public read (bucket public + policy ini = bisa diakses tanpa auth)
CREATE POLICY "wishlist_images_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'wishlist-images');

CREATE POLICY "wishlist_images_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "wishlist_images_update_own" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "wishlist_images_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- SECTION 2: IS_INTERNAL FIELDS DI TRANSACTIONS
-- =====================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_ref_id uuid,
  ADD COLUMN IF NOT EXISTS internal_ref_type text;

-- Drop constraint kalau ada (biar bisa recreate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_internal_ref_type_check'
  ) THEN
    ALTER TABLE public.transactions 
      DROP CONSTRAINT transactions_internal_ref_type_check;
  END IF;
END $$;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_internal_ref_type_check
  CHECK (
    internal_ref_type IS NULL
    OR internal_ref_type IN (
      'envelope_deposit',
      'envelope_withdraw',
      'envelope_cancel',
      'wishlist_purchase'
    )
  );

CREATE INDEX IF NOT EXISTS idx_transactions_is_internal
  ON public.transactions(is_internal)
  WHERE is_internal = true;

CREATE INDEX IF NOT EXISTS idx_transactions_internal_ref
  ON public.transactions(internal_ref_type, internal_ref_id)
  WHERE internal_ref_type IS NOT NULL;

-- =====================================================
-- SECTION 3: ADD envelope_id KE wishlists
-- =====================================================

ALTER TABLE public.wishlists
  ADD COLUMN IF NOT EXISTS envelope_id uuid 
    REFERENCES public.envelopes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wishlists_envelope
  ON public.wishlists(envelope_id);

-- =====================================================
-- SECTION 4: VERIFY
-- =====================================================

SELECT 'bucket' AS cek, id, public::text AS info
FROM storage.buckets WHERE id = 'wishlist-images';

SELECT 'policies' AS cek, count(*)::text AS info
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE 'wishlist%';

SELECT 'columns' AS cek, column_name AS info
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
  AND column_name IN ('is_internal', 'internal_ref_id', 'internal_ref_type');

SELECT 'wishlist_column' AS cek, column_name AS info
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'wishlists'
  AND column_name = 'envelope_id';