import { useState, useMemo } from 'react';
import { useCheckInData } from './useCheckInData';
import { useCheckInActions } from './useCheckInActions';
import { filterParticipants } from './search';
import { ConnectivityBadge } from '../../components/ConnectivityBadge';
import { StatsBar } from '../../components/StatsBar';
import { SearchInput } from '../../components/SearchInput';
import { ParticipantCard } from '../../components/ParticipantCard';

interface CheckInPageProps {
  userEmail?: string;
  onLogout: () => Promise<void>;
  isOnline?: boolean;
}

export function CheckInPage({
  userEmail,
  onLogout,
  isOnline = true,
}: CheckInPageProps) {
  const {
    participants,
    activeCheckIns,
    isLoading,
    error,
    refetch,
    applyCheckIn,
    removeCheckIn,
  } = useCheckInData(true, isOnline);

  const { processingId, actionError, checkIn, undoCheckIn, clearActionError } =
    useCheckInActions({ applyCheckIn, removeCheckIn, isOnline });

  const [searchQuery, setSearchQuery] = useState('');

  // Derived metrics
  const totalCount = participants.length;
  const checkedInCount = Object.keys(activeCheckIns).length;
  const pendingCount = totalCount - checkedInCount;

  // In-memory filtered participants (no network request per keystroke)
  const filteredParticipants = useMemo(() => {
    return filterParticipants(participants, searchQuery);
  }, [participants, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xs shadow-2xs">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Star Experience
              </h1>
              <ConnectivityBadge isOnline={isOnline} />
            </div>
            <p className="truncate text-xs text-slate-500">
              {userEmail || 'Reception Staff'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Operational Container */}
      <main className="mx-auto max-w-xl p-4 pb-12 space-y-4">
        {/* Overview Stats */}
        <StatsBar
          total={totalCount}
          checkedIn={checkedInCount}
          pending={pendingCount}
          isLoading={isLoading}
        />

        {/* Search Bar */}
        <section aria-label="Search participants">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            disabled={isLoading || Boolean(error)}
          />
        </section>

        {/* Action Error Banner (check-in / undo failures) */}
        {actionError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          >
            <span>{actionError}</span>
            <button
              type="button"
              onClick={clearActionError}
              aria-label="Dismiss error"
              className="shrink-0 text-amber-600 hover:text-amber-800 focus:outline-hidden"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em]" />
            <p className="mt-3 text-sm text-slate-500">Loading participant registry...</p>
          </div>
        )}

        {/* Fetch Error Alert */}
        {error && !isLoading && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700"
          >
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 inline-flex items-center rounded-lg bg-red-100 px-3.5 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Participant List */}
        {!isLoading && !error && (
          <section aria-label="Participant list" className="space-y-2.5">
            {participants.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center border border-slate-200 text-slate-500 text-sm">
                No participants registered.
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center border border-slate-200 text-slate-500 text-sm">
                <p>No participants matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredParticipants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  activeCheckIn={activeCheckIns[participant.id]}
                  onCheckIn={checkIn}
                  onUndoCheckIn={undoCheckIn}
                  isProcessing={processingId === participant.id}
                />
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
