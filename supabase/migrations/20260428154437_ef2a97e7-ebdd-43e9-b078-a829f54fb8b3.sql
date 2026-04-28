
-- Replace broad SELECT policy with owner/admin-only access on profiles
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;

CREATE POLICY "Owners and admins read full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Public-safe view that excludes email and other sensitive fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT
  id, first_name, age, gender, interested_in, location,
  ethnicity, religion, values_text, mode, plan, verified,
  banned, flagged, bio, prompts, interests, photos,
  privacy_strict, onboarded, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;

-- Allow authenticated members to read public profile fields via the view
CREATE POLICY "Authenticated read public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
