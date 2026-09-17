import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapRpcError, callCheckIn, callUndoCheckIn } from './checkinApi';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('mapRpcError', () => {
  it('maps ALREADY_CHECKED_IN to user-facing message', () => {
    expect(mapRpcError('ALREADY_CHECKED_IN')).toBe(
      'This participant is already checked in.',
    );
  });

  it('maps NO_ACTIVE_CHECKIN to user-facing message', () => {
    expect(mapRpcError('NO_ACTIVE_CHECKIN')).toBe(
      'This participant has no active check-in to undo.',
    );
  });

  it('maps UNAUTHORIZED to user-facing message', () => {
    expect(mapRpcError('UNAUTHORIZED')).toBe(
      'You must be logged in to perform this action.',
    );
  });

  it('maps PARTICIPANT_NOT_FOUND to user-facing message', () => {
    expect(mapRpcError('PARTICIPANT_NOT_FOUND')).toBe('Participant not found.');
  });

  it('returns generic message for unknown raw error codes', () => {
    expect(mapRpcError('duplicate key value violates unique constraint')).toBe(
      'An unexpected error occurred. Please try again.',
    );
    expect(mapRpcError('')).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('callCheckIn', () => {
  const participantId = 'p-test-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.rpc with check_in and returns created check-in', async () => {
    const mockCheckIn = {
      id: 'c-1',
      participant_id: participantId,
      checked_in_at: '2026-09-17T14:00:00Z',
      checked_in_by: 'u-1',
      undone_at: null,
      undone_by: null,
      created_at: '2026-09-17T14:00:00Z',
    };

    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockCheckIn, error: null } as unknown as ReturnType<typeof supabase.rpc> extends Promise<infer R> ? R : never);

    const result = await callCheckIn(participantId);

    expect(supabase.rpc).toHaveBeenCalledWith('check_in', {
      p_participant_id: participantId,
    });
    expect(result).toEqual(mockCheckIn);
  });

  it('throws with mapped error message when RPC fails with known code', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'ALREADY_CHECKED_IN', code: '23505', details: '', hint: '', name: 'PostgrestError', toJSON: () => ({}) },
    } as unknown as ReturnType<typeof supabase.rpc> extends Promise<infer R> ? R : never);

    await expect(callCheckIn(participantId)).rejects.toThrow(
      'This participant is already checked in.',
    );
  });

  it('throws generic message for unknown RPC error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'unexpected internal error', code: 'P0001', details: '', hint: '', name: 'PostgrestError', toJSON: () => ({}) },
    } as unknown as ReturnType<typeof supabase.rpc> extends Promise<infer R> ? R : never);

    await expect(callCheckIn(participantId)).rejects.toThrow(
      'An unexpected error occurred. Please try again.',
    );
  });
});

describe('callUndoCheckIn', () => {
  const participantId = 'p-test-2';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.rpc with undo_check_in and returns updated check-in', async () => {
    const mockCheckIn = {
      id: 'c-2',
      participant_id: participantId,
      checked_in_at: '2026-09-17T14:00:00Z',
      checked_in_by: 'u-1',
      undone_at: '2026-09-17T15:00:00Z',
      undone_by: 'u-2',
      created_at: '2026-09-17T14:00:00Z',
    };

    vi.mocked(supabase.rpc).mockResolvedValue({ data: mockCheckIn, error: null } as unknown as ReturnType<typeof supabase.rpc> extends Promise<infer R> ? R : never);

    const result = await callUndoCheckIn(participantId);

    expect(supabase.rpc).toHaveBeenCalledWith('undo_check_in', {
      p_participant_id: participantId,
    });
    expect(result).toEqual(mockCheckIn);
  });

  it('throws with mapped error message when no active check-in exists', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'NO_ACTIVE_CHECKIN', code: 'P0002', details: '', hint: '', name: 'PostgrestError', toJSON: () => ({}) },
    } as unknown as ReturnType<typeof supabase.rpc> extends Promise<infer R> ? R : never);

    await expect(callUndoCheckIn(participantId)).rejects.toThrow(
      'This participant has no active check-in to undo.',
    );
  });
});
