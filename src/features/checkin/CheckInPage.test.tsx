import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInPage } from './CheckInPage';
import * as useCheckInDataModule from './useCheckInData';
import * as useCheckInActionsModule from './useCheckInActions';
import type { Participant } from './checkinTypes';

vi.mock('./useCheckInData', () => ({
  useCheckInData: vi.fn(),
}));

vi.mock('./useCheckInActions', () => ({
  useCheckInActions: vi.fn(),
}));

describe('CheckInPage', () => {
  const mockLogout = vi.fn().mockResolvedValue(undefined);
  const mockRefetch = vi.fn();
  const mockCheckIn = vi.fn();
  const mockUndoCheckIn = vi.fn();
  const mockClearActionError = vi.fn();

  const defaultActions = {
    processingId: null,
    actionError: null,
    checkIn: mockCheckIn,
    undoCheckIn: mockUndoCheckIn,
    clearActionError: mockClearActionError,
  };

  const mockParticipants: Participant[] = [
    {
      id: 'p1',
      name: 'João Silva',
      email: 'joao.silva@example.com',
      document_id: 'DOC-111',
      ticket_type: 'Star',
      created_at: '2026-09-17T00:00:00Z',
    },
    {
      id: 'p2',
      name: 'Maria Santos',
      email: 'maria@example.com',
      document_id: 'DOC-222',
      ticket_type: 'Constellation',
      created_at: '2026-09-17T00:00:00Z',
    },
  ];

  const mockActiveCheckIns = {
    p1: {
      id: 'c1',
      participant_id: 'p1',
      checked_in_at: '2026-09-17T10:00:00Z',
      checked_in_by: 'u1',
      undone_at: null,
      undone_by: null,
      created_at: '2026-09-17T10:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCheckInActionsModule.useCheckInActions).mockReturnValue(defaultActions);
  });

  it('renders loading indicator while data is being fetched', () => {
    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: [],
      activeCheckIns: {},
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    render(<CheckInPage userEmail="staff@starexperience.com" onLogout={mockLogout} />);

    expect(screen.getByText(/loading participant registry/i)).toBeInTheDocument();
  });

  it('renders error state when fetch fails', () => {
    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: [],
      activeCheckIns: {},
      isLoading: false,
      error: 'Network connection lost',
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    render(<CheckInPage userEmail="staff@starexperience.com" onLogout={mockLogout} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/network connection lost/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders header, connectivity badge, stats bar, and participant cards', () => {
    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: mockParticipants,
      activeCheckIns: mockActiveCheckIns,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    render(
      <CheckInPage
        userEmail="staff@starexperience.com"
        onLogout={mockLogout}
        isOnline={true}
      />,
    );

    expect(screen.getByTestId('connectivity-badge')).toHaveTextContent(/online/i);
    expect(screen.getByTestId('count-total')).toHaveTextContent('2');
    expect(screen.getByTestId('count-checked-in')).toHaveTextContent('1');
    expect(screen.getByTestId('count-pending')).toHaveTextContent('1');
    expect(screen.getByTestId('participant-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('participant-card-p2')).toBeInTheDocument();
  });

  it('filters participants locally using search query with diacritic tolerance', async () => {
    const user = userEvent.setup();

    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: mockParticipants,
      activeCheckIns: mockActiveCheckIns,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    render(<CheckInPage userEmail="staff@starexperience.com" onLogout={mockLogout} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'joao');

    expect(screen.getByTestId('participant-card-p1')).toBeInTheDocument();
    expect(screen.queryByTestId('participant-card-p2')).not.toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearBtn);

    expect(screen.getByTestId('participant-card-p2')).toBeInTheDocument();
  });

  it('displays empty search result message when no participant matches', async () => {
    const user = userEvent.setup();

    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: mockParticipants,
      activeCheckIns: mockActiveCheckIns,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    render(<CheckInPage userEmail="staff@starexperience.com" onLogout={mockLogout} />);

    await user.type(screen.getByRole('searchbox'), 'NonExistent');

    expect(screen.getByText(/no participants matching/i)).toBeInTheDocument();
  });

  it('shows action error banner and allows dismissal', () => {
    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: [],
      activeCheckIns: {},
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    vi.mocked(useCheckInActionsModule.useCheckInActions).mockReturnValue({
      ...defaultActions,
      actionError: 'This participant is already checked in.',
    });

    render(<CheckInPage userEmail="staff@starexperience.com" onLogout={mockLogout} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This participant is already checked in.',
    );

    // Dismiss button exists
    expect(screen.getByRole('button', { name: /dismiss error/i })).toBeInTheDocument();
  });

  it('passes isProcessing to the card being processed', () => {
    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: mockParticipants,
      activeCheckIns: {},
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    vi.mocked(useCheckInActionsModule.useCheckInActions).mockReturnValue({
      ...defaultActions,
      processingId: 'p1',
    });

    render(<CheckInPage userEmail="staff@starexperience.com" onLogout={mockLogout} />);

    // p1's button should show processing text
    const p1Card = screen.getByTestId('participant-card-p1');
    expect(p1Card).toHaveTextContent('Checking in...');

    // p2 is not processing
    const p2Card = screen.getByTestId('participant-card-p2');
    expect(p2Card).toHaveTextContent('Check-in');
  });

  it('triggers onLogout when logout button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useCheckInDataModule.useCheckInData).mockReturnValue({
      participants: [],
      activeCheckIns: {},
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      applyCheckIn: vi.fn(),
      removeCheckIn: vi.fn(),
    });

    render(<CheckInPage userEmail="staff@starexperience.com" onLogout={mockLogout} />);

    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalled();
  });
});
