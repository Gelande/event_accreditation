interface StatsBarProps {
  total: number;
  checkedIn: number;
  pending: number;
  isLoading?: boolean;
}

export function StatsBar({
  total,
  checkedIn,
  pending,
  isLoading = false,
}: StatsBarProps) {
  return (
    <section aria-label="Check-in overview" className="grid grid-cols-3 gap-2">
      <div className="rounded-xl bg-white p-3 text-center border border-slate-200 shadow-xs">
        <span className="block text-xs font-medium text-slate-500">Total</span>
        <span
          className="text-xl font-bold text-slate-900 tracking-tight"
          data-testid="count-total"
        >
          {isLoading ? '–' : total}
        </span>
      </div>

      <div className="rounded-xl bg-white p-3 text-center border border-emerald-100 shadow-xs bg-emerald-50/20">
        <span className="block text-xs font-semibold text-emerald-700">Checked In</span>
        <span
          className="text-xl font-bold text-emerald-600 tracking-tight"
          data-testid="count-checked-in"
        >
          {isLoading ? '–' : checkedIn}
        </span>
      </div>

      <div className="rounded-xl bg-white p-3 text-center border border-amber-100 shadow-xs bg-amber-50/20">
        <span className="block text-xs font-semibold text-amber-700">Pending</span>
        <span
          className="text-xl font-bold text-amber-600 tracking-tight"
          data-testid="count-pending"
        >
          {isLoading ? '–' : pending}
        </span>
      </div>
    </section>
  );
}
