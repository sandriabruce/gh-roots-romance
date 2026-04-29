-- 1. Seed flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_seed_idx ON public.profiles(is_seed);

-- 2. Public-ish read policy: authenticated members can browse other onboarded, non-banned profiles
DROP POLICY IF EXISTS "Members browse onboarded profiles" ON public.profiles;
CREATE POLICY "Members browse onboarded profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (onboarded = true AND banned = false);

-- 3. Auto-accept matches when the counterpart is a seed profile
CREATE OR REPLACE FUNCTION public.auto_accept_seed_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a_seed boolean;
  b_seed boolean;
BEGIN
  SELECT is_seed INTO a_seed FROM public.profiles WHERE id = NEW.user_a;
  SELECT is_seed INTO b_seed FROM public.profiles WHERE id = NEW.user_b;
  IF COALESCE(a_seed, false) OR COALESCE(b_seed, false) THEN
    NEW.status := 'accepted'::match_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_accept_seed_matches ON public.matches;
CREATE TRIGGER trg_auto_accept_seed_matches
BEFORE INSERT ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.auto_accept_seed_matches();

-- 4. Make the profile-photos bucket readable so seeded photos render in cards
UPDATE storage.buckets SET public = true WHERE id = 'profile-photos';