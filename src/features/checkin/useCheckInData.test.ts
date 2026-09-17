import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCheckInData } from './useCheckInData';
import * as checkinApi from './checkinApi';
import { supabase } from '../../lib/supabase';

vi.mock('./checkinApi', () => ({
  fetchParticipants: vi.fn(),
  fetchActiveCheckIns: vi.fn(),
}));

// Mock Supabase Realtime channel
const mockSubscribe = vi.fn().mockReturnThis();
const mockOn = vi.fn().mockReturnThis();
const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
};

vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}));

describe('useCheckInData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not load data or subscribe when enabled is false', () => {
    const { result } = renderHook(() => useCheckInData(false));

    expect(result.current.participants).toEqual([]);
    expect(result.current.activeCheckIns).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(checkinApi.fetchParticipants).not.toHaveBeenCalled();
    expect(checkinApi.fetchActiveCheckIns).not.toHaveBeenCalled();
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('loads participants and subscribes when enabled and online', async () => {
    const mockParticipants = [
      { id: 'p1', name: 'John Doe', email: 'john@example.com', document_id: '123', created_at: '2026-09-17T00:00:00Z' },
    ];
    
    vi.mocked(checkinApi.fetchParticipants).mockResolvedValue(mockParticipants);
    vi.mocked(checkinApi.fetchActiveCheckIns).mockResolvedValue({});

    const { result } = renderHook(() => useCheckInData(true, true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.participants).toEqual(mockParticipants);
    
    expect(supabase.channel).toHaveBeenCalledWith('public:checkins');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', table: 'checkins' }),
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('refetches data automatically when reconnecting (isOnline transitions from false to true)', async () => {
    vi.mocked(checkinApi.fetchParticipants).mockResolvedValue([]);
    vi.mocked(checkinApi.fetchActiveCheckIns).mockResolvedValue({});

    // Start offline
    const { rerender } = renderHook(({ isOnline }) => useCheckInData(true, isOnline), {
      initialProps: { isOnline: false },
    });

    await waitFor(() => {
      expect(checkinApi.fetchParticipants).toHaveBeenCalledTimes(1); // Initial load still happens
    });

    // Subscriptions don't happen offline
    expect(supabase.channel).not.toHaveBeenCalled();

    // Reconnect
    rerender({ isOnline: true });

    await waitFor(() => {
      expect(checkinApi.fetchParticipants).toHaveBeenCalledTimes(2); // Refetches on reconnect
    });

    // Subscribes now that we are online
    expect(supabase.channel).toHaveBeenCalled();
  });

  it('cleans up subscription on unmount or offline', async () => {
    vi.mocked(checkinApi.fetchParticipants).mockResolvedValue([]);
    vi.mocked(checkinApi.fetchActiveCheckIns).mockResolvedValue({});

    const { unmount, rerender } = renderHook(({ isOnline }) => useCheckInData(true, isOnline), {
      initialProps: { isOnline: true },
    });

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    // Go offline
    rerender({ isOnline: false });
    
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);

    // Come back online
    rerender({ isOnline: true });
    
    // Unmount
    unmount();
    
    expect(supabase.removeChannel).toHaveBeenCalledTimes(2);
  });

  it('processes realtime INSERT events', async () => {
    vi.mocked(checkinApi.fetchParticipants).mockResolvedValue([]);
    vi.mocked(checkinApi.fetchActiveCheckIns).mockResolvedValue({});

    let changeHandler: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _filter, callback) => {
      changeHandler = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useCheckInData(true, true));

    await waitFor(() => {
      expect(changeHandler).toBeDefined();
    });

    const newCheckIn = { id: 'c1', participant_id: 'p1', checked_in_at: 'now' };

    act(() => {
      changeHandler({ eventType: 'INSERT', new: newCheckIn });
    });

    expect(result.current.activeCheckIns['p1']).toEqual(newCheckIn);
  });
  
  it('processes realtime UPDATE events (undo check-in)', async () => {
    vi.mocked(checkinApi.fetchParticipants).mockResolvedValue([]);
    vi.mocked(checkinApi.fetchActiveCheckIns).mockResolvedValue({
      p1: { id: 'c1', participant_id: 'p1', checked_in_at: 'now' } as unknown as import('./checkinTypes').CheckIn,
    });

    let changeHandler: (payload: unknown) => void = () => {};
    mockOn.mockImplementation((_event, _filter, callback) => {
      changeHandler = callback;
      return mockChannel;
    });

    const { result } = renderHook(() => useCheckInData(true, true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(changeHandler).toBeDefined();
    });

    act(() => {
      changeHandler({ eventType: 'UPDATE', new: { id: 'c1', participant_id: 'p1', undone_at: 'now' } });
    });

    expect(result.current.activeCheckIns['p1']).toBeUndefined();
  });
});

