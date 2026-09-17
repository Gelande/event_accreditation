import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchActiveCheckIns, fetchParticipants } from './checkinApi';
import type { ActiveCheckInMap, CheckIn, Participant } from './checkinTypes';

export function useCheckInData(enabled: boolean, isOnline: boolean = true) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeCheckIns, setActiveCheckIns] = useState<ActiveCheckInMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const previousIsOnline = useRef(isOnline);

  const loadData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedParticipants, fetchedCheckIns] = await Promise.all([
        fetchParticipants(),
        fetchActiveCheckIns(),
      ]);
      setParticipants(fetchedParticipants);
      setActiveCheckIns(fetchedCheckIns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event data.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Initial load
  useEffect(() => {
    if (enabled) {
      void loadData();
    } else {
      setParticipants([]);
      setActiveCheckIns({});
      setError(null);
    }
  }, [enabled, loadData]);

  // Refetch when reconnecting
  useEffect(() => {
    if (enabled && isOnline && !previousIsOnline.current) {
      void loadData();
    }
    previousIsOnline.current = isOnline;
  }, [enabled, isOnline, loadData]);

  /** Inserts or replaces an active check-in for the given participant. */
  const applyCheckIn = useCallback((checkIn: CheckIn) => {
    setActiveCheckIns((prev) => ({ ...prev, [checkIn.participant_id]: checkIn }));
  }, []);

  /** Removes the active check-in for the given participant (after undo). */
  const removeCheckIn = useCallback((participantId: string) => {
    setActiveCheckIns((prev) => {
      const next = { ...prev };
      delete next[participantId];
      return next;
    });
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!enabled || !isOnline) return;

    const channel = supabase
      .channel('public:checkins')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkins' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            applyCheckIn(payload.new as CheckIn);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as CheckIn;
            if (updated.undone_at) {
              removeCheckIn(updated.participant_id);
            } else {
              applyCheckIn(updated);
            }
          } else if (payload.eventType === 'DELETE') {
            // Unlikely due to app rules, but good hygiene
            const deleted = payload.old as { id: string; participant_id: string };
            if (deleted && deleted.participant_id) {
              removeCheckIn(deleted.participant_id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, isOnline, applyCheckIn, removeCheckIn]);

  return {
    participants,
    activeCheckIns,
    isLoading,
    error,
    refetch: loadData,
    applyCheckIn,
    removeCheckIn,
  };
}
