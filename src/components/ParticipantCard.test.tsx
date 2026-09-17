import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantCard } from './ParticipantCard';
import type { CheckIn, Participant } from '../features/checkin/checkinTypes';

describe('ParticipantCard', () => {
  const mockParticipant: Participant = {
    id: 'p-1',
    name: 'Sofia Mendes',
    email: 'sofia@example.com',
    document_id: 'DOC-12345',
    created_at: '2026-09-17T00:00:00Z',
  };

  const mockActiveCheckIn: CheckIn = {
    id: 'c-1',
    participant_id: 'p-1',
    checked_in_at: '2026-09-17T14:30:00Z',
    checked_in_by: 'staff-1',
    undone_at: null,
    undone_by: null,
    created_at: '2026-09-17T14:30:00Z',
  };

  it('renders participant identity fields', () => {
    render(<ParticipantCard participant={mockParticipant} />);

    expect(screen.getByText('Sofia Mendes')).toBeInTheDocument();
    expect(screen.getByText('sofia@example.com')).toBeInTheDocument();
    expect(screen.getByText('DOC-12345')).toBeInTheDocument();
  });

  it('renders Not Checked In state and primary Check-in action button', async () => {
    const user = userEvent.setup();
    const onCheckIn = vi.fn();

    render(
      <ParticipantCard
        participant={mockParticipant}
        onCheckIn={onCheckIn}
      />,
    );

    expect(screen.getByText('Not Checked In')).toBeInTheDocument();
    const checkInBtn = screen.getByRole('button', { name: /check in sofia mendes/i });
    expect(checkInBtn).toBeInTheDocument();

    await user.click(checkInBtn);
    expect(onCheckIn).toHaveBeenCalledWith('p-1');
  });

  it('renders Checked In state, check-in time, and Undo button', () => {
    render(
      <ParticipantCard
        participant={mockParticipant}
        activeCheckIn={mockActiveCheckIn}
      />,
    );

    expect(screen.getByText('Checked In')).toBeInTheDocument();
    expect(screen.getByText(/checked in at/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo check in for sofia mendes/i })).toBeInTheDocument();
  });

  it('shows undo confirmation when Undo Check-in is clicked, then calls onUndoCheckIn on confirm', async () => {
    const user = userEvent.setup();
    const onUndoCheckIn = vi.fn();

    render(
      <ParticipantCard
        participant={mockParticipant}
        activeCheckIn={mockActiveCheckIn}
        onUndoCheckIn={onUndoCheckIn}
      />,
    );

    // Click Undo — should show confirmation
    const undoBtn = screen.getByRole('button', { name: /undo check in for sofia mendes/i });
    await user.click(undoBtn);

    // Confirmation buttons should appear
    expect(screen.getByRole('button', { name: /confirm undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // onUndoCheckIn not yet called
    expect(onUndoCheckIn).not.toHaveBeenCalled();

    // Confirm
    const confirmBtn = screen.getByRole('button', { name: /confirm undo/i });
    await user.click(confirmBtn);

    expect(onUndoCheckIn).toHaveBeenCalledWith('p-1');
  });

  it('cancels undo confirmation and returns to original state', async () => {
    const user = userEvent.setup();
    const onUndoCheckIn = vi.fn();

    render(
      <ParticipantCard
        participant={mockParticipant}
        activeCheckIn={mockActiveCheckIn}
        onUndoCheckIn={onUndoCheckIn}
      />,
    );

    await user.click(screen.getByRole('button', { name: /undo check in for sofia mendes/i }));

    expect(screen.getByRole('button', { name: /confirm undo/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Should be back to original Undo button
    expect(screen.queryByRole('button', { name: /confirm undo/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo check in for sofia mendes/i })).toBeInTheDocument();
    expect(onUndoCheckIn).not.toHaveBeenCalled();
  });

  it('disables check-in button when isProcessing is true', () => {
    render(
      <ParticipantCard
        participant={mockParticipant}
        isProcessing={true}
      />,
    );

    const checkInBtn = screen.getByRole('button', { name: /check in sofia mendes/i });
    expect(checkInBtn).toBeDisabled();
    expect(checkInBtn).toHaveTextContent('Checking in...');
  });
});
