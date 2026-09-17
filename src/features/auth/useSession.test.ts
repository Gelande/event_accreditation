import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { useSession } from './useSession';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('useSession', () => {
  let authCallback: (event: string, session: Session | null) => void;
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authCallback = callback as (event: string, session: Session | null) => void;
      return {
        data: {
          subscription: {
            id: 'sub-1',
            callback: authCallback,
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });
  });

  it('initializes with active session if one exists', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'staff@starexperience.com' },
      access_token: 'token',
    } as unknown as Session;

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('initializes unauthenticated if no session exists', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates state when onAuthStateChange fires', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newSession = {
      user: { id: 'user-2', email: 'operator@starexperience.com' },
      access_token: 'token-2',
    } as unknown as Session;

    act(() => {
      authCallback('SIGNED_IN', newSession);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('operator@starexperience.com');
  });

  it('calls signOut on logout', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.logout();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
