-- Lock down the trigger function: it only needs to run from the trigger, not via API
REVOKE EXECUTE ON FUNCTION public.auto_accept_seed_matches() FROM PUBLIC, anon, authenticated;

-- Allow public read of individual objects in profile-photos but block listing
DROP POLICY IF EXISTS "Public read profile-photos" ON storage.objects;
CREATE POLICY "Public read profile-photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile-photos');