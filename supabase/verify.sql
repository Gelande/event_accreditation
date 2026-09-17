-- ============================================================================
-- Star Experience Database Verification Script
-- Run this script in the Supabase SQL Editor or via psql to verify all invariants.
-- ============================================================================

DO $$
DECLARE
  v_test_participant_id uuid;
  v_operator_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_second_operator_id uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  v_checkin_1 public.checkins;
  v_checkin_2 public.checkins;
  v_count integer;
  v_error_caught boolean;
BEGIN
  RAISE NOTICE '--- STARTING DATABASE VERIFICATION ---';

  -- --------------------------------------------------------------------------
  -- TEST 1: Table & Column Invariants
  -- --------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'participants') THEN
    RAISE EXCEPTION 'Verification Failed: table public.participants does not exist';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkins') THEN
    RAISE EXCEPTION 'Verification Failed: table public.checkins does not exist';
  END IF;

  RAISE NOTICE 'Test 1 Passed: Tables exist.';

  -- --------------------------------------------------------------------------
  -- TEST 2: RLS Enabled
  -- --------------------------------------------------------------------------
  SELECT count(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('participants', 'checkins')
    AND rowsecurity = true;

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'Verification Failed: RLS is not enabled on both tables';
  END IF;

  RAISE NOTICE 'Test 2 Passed: RLS is enabled on both tables.';

  -- --------------------------------------------------------------------------
  -- TEST 3: Partial Unique Index Exists
  -- --------------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'checkins'
      AND indexname = 'checkins_active_participant_idx'
  ) THEN
    RAISE EXCEPTION 'Verification Failed: Partial unique index checkins_active_participant_idx missing';
  END IF;

  RAISE NOTICE 'Test 3 Passed: Partial unique index exists.';

  -- --------------------------------------------------------------------------
  -- TEST 4: Create a test participant
  -- --------------------------------------------------------------------------
  INSERT INTO public.participants (name, email, document_id)
  VALUES ('Test Participant', 'test@starexperience.internal', 'NIF-123456')
  RETURNING id INTO v_test_participant_id;

  IF v_test_participant_id IS NULL THEN
    RAISE EXCEPTION 'Verification Failed: Failed to insert test participant';
  END IF;

  RAISE NOTICE 'Test 4 Passed: Test participant created with ID %', v_test_participant_id;

  -- --------------------------------------------------------------------------
  -- TEST 5: RPC check_in fails without authenticated operator
  -- --------------------------------------------------------------------------
  -- Ensure request.jwt.claim.sub is not set
  PERFORM set_config('request.jwt.claim.sub', '', true);
  v_error_caught := false;
  BEGIN
    PERFORM public.check_in(v_test_participant_id);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'UNAUTHORIZED' THEN
      v_error_caught := true;
    ELSE
      RAISE EXCEPTION 'Unexpected error when unauthorized: %', SQLERRM;
    END IF;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'Verification Failed: check_in did not reject unauthenticated call';
  END IF;

  RAISE NOTICE 'Test 5 Passed: check_in rejects unauthenticated caller.';

  -- --------------------------------------------------------------------------
  -- TEST 6: RPC check_in succeeds with authenticated operator
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_operator_id::text, true);

  v_checkin_1 := public.check_in(v_test_participant_id);

  IF v_checkin_1.id IS NULL OR v_checkin_1.checked_in_by <> v_operator_id OR v_checkin_1.undone_at IS NOT NULL THEN
    RAISE EXCEPTION 'Verification Failed: check_in returned invalid record: %', v_checkin_1;
  END IF;

  RAISE NOTICE 'Test 6 Passed: check_in succeeded and attributed operator %', v_operator_id;

  -- --------------------------------------------------------------------------
  -- TEST 7: RPC check_in rejects duplicate active check-in (Invariants & Index)
  -- --------------------------------------------------------------------------
  v_error_caught := false;
  BEGIN
    PERFORM public.check_in(v_test_participant_id);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'ALREADY_CHECKED_IN' THEN
      v_error_caught := true;
    END IF;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'Verification Failed: Duplicate active check_in was not rejected';
  END IF;

  RAISE NOTICE 'Test 7 Passed: Duplicate active check_in rejected deterministically.';

  -- --------------------------------------------------------------------------
  -- TEST 8: RPC undo_check_in succeeds with (possibly different) operator
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_second_operator_id::text, true);

  v_checkin_2 := public.undo_check_in(v_test_participant_id);

  IF v_checkin_2.id <> v_checkin_1.id THEN
    RAISE EXCEPTION 'Verification Failed: undo_check_in did not update the expected row';
  END IF;

  IF v_checkin_2.undone_at IS NULL OR v_checkin_2.undone_by <> v_second_operator_id THEN
    RAISE EXCEPTION 'Verification Failed: undo_check_in failed to fill undone_at / undone_by';
  END IF;

  -- Verify row was NOT deleted from table
  SELECT count(*) INTO v_count
  FROM public.checkins
  WHERE id = v_checkin_1.id AND undone_at IS NOT NULL;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Verification Failed: Check-in row was deleted instead of marked undone';
  END IF;

  RAISE NOTICE 'Test 8 Passed: undo_check_in succeeded, preserved history, and attributed second operator.';

  -- --------------------------------------------------------------------------
  -- TEST 9: RPC undo_check_in fails deterministically when no active check-in exists
  -- --------------------------------------------------------------------------
  v_error_caught := false;
  BEGIN
    PERFORM public.undo_check_in(v_test_participant_id);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'NO_ACTIVE_CHECKIN' THEN
      v_error_caught := true;
    END IF;
  END;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'Verification Failed: undo_check_in did not report NO_ACTIVE_CHECKIN';
  END IF;

  RAISE NOTICE 'Test 9 Passed: undo_check_in deterministically raises NO_ACTIVE_CHECKIN.';

  -- --------------------------------------------------------------------------
  -- TEST 10: Re-checking in creates a second check-in row (history preserved)
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_operator_id::text, true);
  v_checkin_2 := public.check_in(v_test_participant_id);

  SELECT count(*) INTO v_count
  FROM public.checkins
  WHERE participant_id = v_test_participant_id;

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'Verification Failed: Expected 2 checkin records for participant, found %', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.checkins
  WHERE participant_id = v_test_participant_id AND undone_at IS NULL;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Verification Failed: Expected exactly 1 active checkin record, found %', v_count;
  END IF;

  RAISE NOTICE 'Test 10 Passed: Participant can be re-checked in; multiple historical rows exist with 1 active.';

  -- --------------------------------------------------------------------------
  -- CLEANUP TEST DATA
  -- --------------------------------------------------------------------------
  DELETE FROM public.checkins WHERE participant_id = v_test_participant_id;
  DELETE FROM public.participants WHERE id = v_test_participant_id;

  RAISE NOTICE '--- ALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY ---';
END;
$$;
