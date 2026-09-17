import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckInActions } from './useCheckInActions';
import * as checkinApi from './checkinApi';
import type { CheckIn } from './checkinTypes';

vi.mock('./checkinApi', () => ({
  callCheckIn: vi.fn(),
  callUndoCheckIn: vi.fn(),
}));

describe('useCheckInActions', () => {
  const mockApplyCheckIn = vi.fn();
  const mockRemoveCheckIn = vi.fn();

  const defaultOptions = {
    applyCheckIn: mockApplyCheckIn,
    removeCheckIn: mockRemoveCheckIn,
    isOnline: true,
  };

  const mockCheckIn: CheckIn = {
    id: 'c-1',
    participant_id: 'p-1',
    checked_in_at: '2026-09-17T14:00:00Z',
    checked_in_by: 'u-1',
    undone_at: null,
    undone_by: null,
    created_at: '2026-09-17T14:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkIn', () => {
    it('sets processingId during call and clears it after success', async () => {
      vi.mocked(checkinApi.callCheckIn).mockResolvedValue(mockCheckIn);

      const { result } = renderHook(() => useCheckInActions(defaultOptions));

      expect(result.current.processingId).toBeNull();

      await act(async () => {
        await result.current.checkIn('p-1');
      });

      expect(result.current.processingId).toBeNull();
      expect(mockApplyCheckIn).toHaveBeenCalledWith(mockCheckIn);
      expect(result.current.actionError).toBeNull();
    });

    it('sets actionError and clears processingId on failure', async () => {
      vi.mocked(checkinApi.callCheckIn).mockRejectedValue(
        new Error('This participant is already checked in.'),
      );

      const { result } = renderHook(() => useCheckInActions(defaultOptions));

      await act(async () => {
        await result.current.checkIn('p-1');
      });

      expect(result.current.processingId).toBeNull();
      expect(result.current.actionError).toBe('This participant is already checked in.');
      expect(mockApplyCheckIn).not.toHaveBeenCalled();
    });

    it('sets actionError and skips API call when offline', async () => {
      const { result } = renderHook(() =>
        useCheckInActions({ ...defaultOptions, isOnline: false }),
      );

      await act(async () => {
        await result.current.checkIn('p-1');
      });

      expect(checkinApi.callCheckIn).not.toHaveBeenCalled();
      expect(result.current.actionError).toContain('offline');
    });
  });

  describe('undoCheckIn', () => {
    it('calls callUndoCheckIn and removes check-in on success', async () => {
      vi.mocked(checkinApi.callUndoCheckIn).mockResolvedValue({
        ...mockCheckIn,
        undone_at: '2026-09-17T15:00:00Z',
      });

      const { result } = renderHook(() => useCheckInActions(defaultOptions));

      await act(async () => {
        await result.current.undoCheckIn('p-1');
      });

      expect(result.current.processingId).toBeNull();
      expect(mockRemoveCheckIn).toHaveBeenCalledWith('p-1');
      expect(result.current.actionError).toBeNull();
    });

    it('sets actionError on undo failure', async () => {
      vi.mocked(checkinApi.callUndoCheckIn).mockRejectedValue(
        new Error('This participant has no active check-in to undo.'),
      );

      const { result } = renderHook(() => useCheckInActions(defaultOptions));

      await act(async () => {
        await result.current.undoCheckIn('p-1');
      });

      expect(result.current.actionError).toBe(
        'This participant has no active check-in to undo.',
      );
      expect(mockRemoveCheckIn).not.toHaveBeenCalled();
    });

    it('blocks undo when offline', async () => {
      const { result } = renderHook(() =>
        useCheckInActions({ ...defaultOptions, isOnline: false }),
      );

      await act(async () => {
        await result.current.undoCheckIn('p-1');
      });

      expect(checkinApi.callUndoCheckIn).not.toHaveBeenCalled();
      expect(result.current.actionError).toContain('offline');
    });
  });

  describe('clearActionError', () => {
    it('clears a previously set error', async () => {
      vi.mocked(checkinApi.callCheckIn).mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() => useCheckInActions(defaultOptions));

      await act(async () => {
        await result.current.checkIn('p-1');
      });

      expect(result.current.actionError).toBeTruthy();

      act(() => {
        result.current.clearActionError();
      });

      expect(result.current.actionError).toBeNull();
    });
  });
});
