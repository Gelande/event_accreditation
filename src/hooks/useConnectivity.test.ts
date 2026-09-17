import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectivity } from './useConnectivity';

describe('useConnectivity', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    vi.stubGlobal('navigator', { ...navigator, onLine: originalOnLine });
  });

  it('initializes with navigator.onLine', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    const { result } = renderHook(() => useConnectivity());
    expect(result.current).toBe(false);
  });

  it('updates when online/offline events are dispatched', () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true });
    const { result } = renderHook(() => useConnectivity());
    
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
