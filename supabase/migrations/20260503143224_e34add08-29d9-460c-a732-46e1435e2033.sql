
-- 1. Remove broad SELECT policies on storage.objects for profile-photos bucket.
-- The bucket is public, so files remain accessible via direct URL; we just block listing.
DROP POLICY IF EXISTS "Public read profile-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read profile photos" ON storage.objects;

-- Keep an admin-only listing policy so admins can still enumerate files.
CREATE POLICY "Admins list profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-photos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Lock down SECURITY DEFINER functions so they aren't callable via the API.
-- Trigger functions should not be invokable by clients at all.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_accept_seed_matches() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies (which run as the table owner),
-- so revoking EXECUTE from clients does not break RLS evaluation.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
