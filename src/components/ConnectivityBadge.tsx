interface ConnectivityBadgeProps {
  isOnline?: boolean;
}

export function ConnectivityBadge({ isOnline = true }: ConnectivityBadgeProps) {
  return (
    <div
      data-testid="connectivity-badge"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
      role="status"
      aria-label={`Connectivity status: ${isOnline ? 'Online' : 'Offline'}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
        }`}
        aria-hidden="true"
      />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}
