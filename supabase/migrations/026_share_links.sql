-- =====================================================
-- 026_share_links.sql
-- Public share link for split bill
-- Auto-expire 5 hari
-- =====================================================

-- 1. Tambah kolom share di events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS share_slug text,
  ADD COLUMN IF NOT EXISTS share_image_url text,
  ADD COLUMN IF NOT EXISTS share_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS share_expires_at timestamptz;

-- 2. Unique index untuk slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_share_slug
  ON public.events(share_slug)
  WHERE share_slug IS NOT NULL;

-- 3. Index untuk cleanup
CREATE INDEX IF NOT EXISTS idx_events_share_expires
  ON public.events(share_expires_at)
  WHERE share_expires_at IS NOT NULL;

-- 4. RPC: fetch shared event (bypass RLS untuk public view)
-- Return: jsonb event + items + participants
CREATE OR REPLACE FUNCTION public.get_shared_event(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
  v_expires_at timestamptz;
  v_result jsonb;
BEGIN
  -- Cari event by slug
  SELECT id, share_expires_at
    INTO v_event_id, v_expires_at
    FROM public.events
   WHERE share_slug = p_slug
   LIMIT 1;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- Cek expired
  IF v_expires_at IS NULL OR v_expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- Build result
  SELECT jsonb_build_object(
    'event', to_jsonb(e.*) - 'user_id' - 'profile_id',
    'items', COALESCE((
      SELECT jsonb_agg(to_jsonb(i.*) ORDER BY i.sort_order)
      FROM public.event_items i
      WHERE i.event_id = e.id
    ), '[]'::jsonb),
    'participants', COALESCE((
      SELECT jsonb_agg(to_jsonb(p.*) ORDER BY p.created_at)
      FROM public.event_participants p
      WHERE p.event_id = e.id
    ), '[]'::jsonb),
    'item_shares', COALESCE((
      SELECT jsonb_agg(to_jsonb(s.*))
      FROM public.event_item_shares s
      JOIN public.event_items i ON i.id = s.item_id
      WHERE i.event_id = e.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public.events e
  WHERE e.id = v_event_id;

  RETURN v_result;
END;
$$;

-- 5. Function: cleanup expired share links
-- Return jumlah event yang di-cleanup
CREATE OR REPLACE FUNCTION public.cleanup_expired_share_links()
RETURNS TABLE(event_id uuid, slug text, image_url text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.events e
     SET share_slug = NULL,
         share_image_url = NULL,
         share_created_at = NULL,
         share_expires_at = NULL
   WHERE e.share_expires_at IS NOT NULL
     AND e.share_expires_at < now()
  RETURNING e.id, e.share_slug, e.share_image_url;
END;
$$;

-- 6. Grant execute ke anon (public) - cuma function read
GRANT EXECUTE ON FUNCTION public.get_shared_event(text) TO anon, authenticated;

-- 7. Verify
SELECT 'columns' AS cek, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events'
  AND column_name LIKE 'share_%'
UNION ALL
SELECT 'functions', routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_shared_event', 'cleanup_expired_share_links');