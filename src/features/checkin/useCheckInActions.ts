import { useState, useCallback } from 'react';
import { callCheckIn, callUndoCheckIn } from './checkinApi';
import type { CheckIn } from './checkinTypes';

interface UseCheckInActionsOptions {
  applyCheckIn: (checkIn: CheckIn) => void;
  removeCheckIn: (participantId: string) => void;
  isOnline: boolean;
}

export function useCheckInActions({
  applyCheckIn,
  removeCheckIn,
  isOnline,
}: UseCheckInActionsOptions) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const checkIn = useCallback(
    async (participantId: string) => {
      if (!isOnline) {
        setActionError('Check-in is not available while offline.');
        return;
      }
      setProcessingId(participantId);
      setActionError(null);
      try {
        const checkInRecord = await callCheckIn(participantId);
        applyCheckIn(checkInRecord);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setProcessingId(null);
      }
    },
    [isOnline, applyCheckIn],
  );

  const undoCheckIn = useCallback(
    async (participantId: string) => {
      if (!isOnline) {
        setActionError('Undo is not available while offline.');
        return;
      }
      setProcessingId(participantId);
      setActionError(null);
      try {
        await callUndoCheckIn(participantId);
        removeCheckIn(participantId);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setProcessingId(null);
      }
    },
    [isOnline, removeCheckIn],
  );

  const clearActionError = useCallback(() => setActionError(null), []);

  return {
    processingId,
    actionError,
    checkIn,
    undoCheckIn,
    clearActionError,
  };
}
