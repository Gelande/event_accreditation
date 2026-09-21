import { useState } from 'react';
import type { CheckIn, Participant } from '../features/checkin/checkinTypes';

interface ParticipantCardProps {
  participant: Participant;
  activeCheckIn?: CheckIn;
  onCheckIn?: (participantId: string) => void;
  onUndoCheckIn?: (participantId: string) => void;
  isProcessing?: boolean;
}

function formatCheckInTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ParticipantCard({
  participant,
  activeCheckIn,
  onCheckIn,
  onUndoCheckIn,
  isProcessing = false,
}: ParticipantCardProps) {
  const isCheckedIn = Boolean(activeCheckIn);
  const [confirmingUndo, setConfirmingUndo] = useState(false);

  const handleUndoRequest = () => {
    setConfirmingUndo(true);
  };

  const handleUndoConfirm = () => {
    setConfirmingUndo(false);
    onUndoCheckIn?.(participant.id);
  };

  const handleUndoCancel = () => {
    setConfirmingUndo(false);
  };

  return (
    <article
      data-testid={`participant-card-${participant.id}`}
      className={`rounded-xl border bg-white p-4 shadow-xs transition-shadow ${
        isCheckedIn ? 'border-emerald-200/80 bg-emerald-50/10' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Identity Details */}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900 truncate">
            {participant.name}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            {participant.email && (
              <span className="truncate">{participant.email}</span>
            )}
            {participant.email && participant.document_id && <span>•</span>}
            {participant.document_id && (
              <span className="font-mono">{participant.document_id}</span>
            )}
          </div>

          {/* Ticket Type & Kit/Credential Delivery Banner */}
          <div className="mt-2.5">
            {participant.ticket_type === 'Constellation' ? (
              <div
                data-testid={`ticket-info-${participant.id}`}
                className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/90 px-2.5 py-1.5 text-xs text-amber-900"
              >
                <span
                  data-testid={`ticket-badge-${participant.id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 font-bold text-amber-950"
                >
                  <span aria-hidden="true">✨</span> Constellation
                </span>
                <span className="font-medium text-amber-800">
                  Entregar: Kit Constellation + Credencial Constellation
                </span>
              </div>
            ) : (
              <div
                data-testid={`ticket-info-${participant.id}`}
                className="flex flex-wrap items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/90 px-2.5 py-1.5 text-xs text-indigo-900"
              >
                <span
                  data-testid={`ticket-badge-${participant.id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-200/80 px-2 py-0.5 font-bold text-indigo-950"
                >
                  <span aria-hidden="true">⭐</span> Star
                </span>
                <span className="font-medium text-indigo-800">
                  Entregar: Kit Star + Credencial Star
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isCheckedIn ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <svg
                className="h-3 w-3 text-emerald-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Checked In
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Not Checked In
            </span>
          )}
        </div>
      </div>

      {/* Action and Time Section */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          {isCheckedIn && activeCheckIn?.checked_in_at && (
            <span className="text-xs text-slate-500">
              Checked in at{' '}
              <time dateTime={activeCheckIn.checked_in_at} className="font-medium text-slate-700">
                {formatCheckInTime(activeCheckIn.checked_in_at)}
              </time>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCheckedIn ? (
            confirmingUndo ? (
              /* Undo Confirmation */
              <>
                <button
                  type="button"
                  onClick={handleUndoCancel}
                  disabled={isProcessing}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUndoConfirm}
                  disabled={isProcessing}
                  aria-label={`Confirm undo check in for ${participant.name}`}
                  className="inline-flex min-h-[40px] items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Undoing...' : 'Confirm Undo'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleUndoRequest}
                disabled={isProcessing}
                aria-label={`Undo check in for ${participant.name}`}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                Undo Check-in
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => onCheckIn?.(participant.id)}
              disabled={isProcessing}
              aria-label={`Check in ${participant.name}`}
              className="inline-flex min-h-[40px] items-center rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'Checking in...' : 'Check-in'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
