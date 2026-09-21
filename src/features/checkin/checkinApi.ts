import { supabase } from '../../lib/supabase';
import type { ActiveCheckInMap, CheckIn, Participant } from './checkinTypes';

export async function fetchParticipants(): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, email, document_id, ticket_type, created_at')
    .order('name', { ascending: true });

  if (error) {
    throw new Error('Failed to load participants: ' + error.message);
  }

  return (data as Participant[]) || [];
}

export async function fetchActiveCheckIns(): Promise<ActiveCheckInMap> {
  const { data, error } = await supabase
    .from('checkins')
    .select('id, participant_id, checked_in_at, checked_in_by, undone_at, undone_by, created_at')
    .is('undone_at', null);

  if (error) {
    throw new Error('Failed to load check-ins: ' + error.message);
  }

  const checkins = (data as CheckIn[]) || [];
  const activeMap: ActiveCheckInMap = {};

  for (const checkin of checkins) {
    activeMap[checkin.participant_id] = checkin;
  }

  return activeMap;
}

// ---------------------------------------------------------------------------
// Stable application-level error codes (must match RAISE EXCEPTION messages
// in the database RPC functions)
// ---------------------------------------------------------------------------
const USER_FACING_ERRORS: Record<string, string> = {
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  PARTICIPANT_NOT_FOUND: 'Participant not found.',
  ALREADY_CHECKED_IN: 'This participant is already checked in.',
  NO_ACTIVE_CHECKIN: 'This participant has no active check-in to undo.',
};

/**
 * Maps a raw RPC error message string to a stable, user-facing description.
 * Raw database error text is never surfaced to the UI.
 */
export function mapRpcError(rawMessage: string): string {
  return USER_FACING_ERRORS[rawMessage] ?? 'An unexpected error occurred. Please try again.';
}

/**
 * Calls the `check_in` PostgreSQL RPC function.
 * Never directly INSERTs into `checkins`.
 */
export async function callCheckIn(participantId: string): Promise<CheckIn> {
  const { data, error } = await supabase.rpc('check_in', {
    p_participant_id: participantId,
  });

  if (error) {
    throw new Error(mapRpcError(error.message));
  }

  return data as CheckIn;
}

/**
 * Calls the `undo_check_in` PostgreSQL RPC function.
 * Never directly UPDATEs or DELETEs from `checkins`.
 */
export async function callUndoCheckIn(participantId: string): Promise<CheckIn> {
  const { data, error } = await supabase.rpc('undo_check_in', {
    p_participant_id: participantId,
  });

  if (error) {
    throw new Error(mapRpcError(error.message));
  }

  return data as CheckIn;
}
