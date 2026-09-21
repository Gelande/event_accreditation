import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import * as useSessionModule from '../features/auth/useSession';
import * as useCheckInDataModule from '../features/checkin/useCheckInData';

vi.mock('../features/auth/useSession', () => ({
  useSession: vi.fn(),
}));

vi.mock('../features/checkin/useCheckInData', () => ({
  useCheckInData: vi.fn(),
}));

vi.mock('../hooks/useConnectivity', () => ({
  useConnectivity: vi.fn(() => true),
}));

describe('App', () => {
  it('shows loading state while verifying session', () => {
    vi.mocked(useSessionModule.useSession).mockReturnValue({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      logout: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
  });

  it('renders login page when unauthenticated and blocks participant data', () => {
    vi.mocked(useSessionModule.useSession).mockReturnValue({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
    });

    render(<App />);

    // Login form should be present
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Participant UI must NOT be present
    expect(screen.queryByTestId('count-total')).not.toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
  });

  it('renders check-in view when authenticated', () => {
    vi.mocked(useSessionModule.useSession).mockReturnValue({
      session: { user: { id: 'u1', email: 'staff@starexperience.com' } } as unknown as import('@supabase/supabase-js').Session,
      user: { id: 'u1', email: 'staff@starexperience.com' } as unknown as import('@supabase/supabase-js').User,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });

    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: [
        { id: 'p1', name: 'Ana Oliveira', email: 'ana@example.com', document_id: null, ticket_type: 'Star', created_at: '2026-09-17T00:00:00Z' },
      ],
      activeCheckIns: {},
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    render(<App />);

    // CheckIn page should be visible
    expect(screen.getByText('Ana Oliveira')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText('staff@starexperience.com')).toBeInTheDocument();
  });
});
