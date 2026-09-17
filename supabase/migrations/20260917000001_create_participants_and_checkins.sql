-- Migration: 20260917000001_create_participants_and_checkins.sql
-- Description: Schema, RLS policies, indexes, and RPC functions for Star Experience Check-in

-- 1. Create participants table
CREATE TABLE IF NOT EXISTS public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NULL,
  document_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create checkins table
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_in_by uuid NOT NULL,
  undone_at timestamptz NULL,
  undone_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes
-- Partial unique index: enforces only ONE active check-in per participant
CREATE UNIQUE INDEX IF NOT EXISTS checkins_active_participant_idx
  ON public.checkins (participant_id)
  WHERE undone_at IS NULL;

-- Foreign key lookup index
CREATE INDEX IF NOT EXISTS checkins_participant_id_idx
  ON public.checkins (participant_id);

-- Check-in time index for sorting/filtering
CREATE INDEX IF NOT EXISTS checkins_checked_in_at_idx
  ON public.checkins (checked_in_at DESC);

-- Participant search index
CREATE INDEX IF NOT EXISTS participants_name_idx
  ON public.participants (name);

-- 4. Row Level Security (RLS)
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- 5. Table Access Grants and Revocations
-- Anonymous users cannot read or modify any data
REVOKE ALL ON public.participants FROM anon, public;
REVOKE ALL ON public.checkins FROM anon, public;

-- Authenticated staff can read rows
GRANT SELECT ON public.participants TO authenticated;
GRANT SELECT ON public.checkins TO authenticated;

-- Browser roles CANNOT directly mutate participant data or check-in history
REVOKE INSERT, UPDATE, DELETE ON public.participants FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.checkins FROM authenticated;

-- 6. RLS Policies
-- Authenticated staff can SELECT participants
CREATE POLICY "Allow authenticated staff to read participants"
  ON public.participants
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated staff can SELECT checkins
CREATE POLICY "Allow authenticated staff to read checkins"
  ON public.checkins
  FOR SELECT
  TO authenticated
  USING (true);

-- 7. RPC Function: check_in(p_participant_id uuid)
CREATE OR REPLACE FUNCTION public.check_in(p_participant_id uuid)
RETURNS public.checkins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_checkin public.checkins;
BEGIN
  -- Require an authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '28000';
  END IF;

  -- Validate participant exists
  IF NOT EXISTS (SELECT 1 FROM public.participants WHERE id = p_participant_id) THEN
    RAISE EXCEPTION 'PARTICIPANT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- Check if already actively checked in
  IF EXISTS (
    SELECT 1 FROM public.checkins
    WHERE participant_id = p_participant_id AND undone_at IS NULL
  ) THEN
    RAISE EXCEPTION 'ALREADY_CHECKED_IN' USING ERRCODE = '23505';
  END IF;

  -- Insert new active check-in
  BEGIN
    INSERT INTO public.checkins (
      participant_id,
      checked_in_at,
      checked_in_by
    )
    VALUES (
      p_participant_id,
      now(),
      v_user_id
    )
    RETURNING * INTO v_checkin;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'ALREADY_CHECKED_IN' USING ERRCODE = '23505';
  END;

  RETURN v_checkin;
END;
$$;

-- 8. RPC Function: undo_check_in(p_participant_id uuid)
CREATE OR REPLACE FUNCTION public.undo_check_in(p_participant_id uuid)
RETURNS public.checkins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_active_id uuid;
  v_checkin public.checkins;
BEGIN
  -- Require an authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '28000';
  END IF;

  -- Find the current active check-in and lock row
  SELECT id INTO v_active_id
  FROM public.checkins
  WHERE participant_id = p_participant_id AND undone_at IS NULL
  FOR UPDATE;

  IF v_active_id IS NULL THEN
    RAISE EXCEPTION 'NO_ACTIVE_CHECKIN' USING ERRCODE = 'P0002';
  END IF;

  -- Mark active check-in as undone (never delete history)
  UPDATE public.checkins
  SET
    undone_at = now(),
    undone_by = v_user_id
  WHERE id = v_active_id
  RETURNING * INTO v_checkin;

  RETURN v_checkin;
END;
$$;

-- 9. RPC Privileges
REVOKE EXECUTE ON FUNCTION public.check_in(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_in(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.undo_check_in(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.undo_check_in(uuid) TO authenticated;

-- 10. Realtime configuration
ALTER TABLE public.checkins REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.checkins;
  END IF;
END
$$;
