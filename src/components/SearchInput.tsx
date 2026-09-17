interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  disabled = false,
}: SearchInputProps) {
  return (
    <div className="relative">
      <label htmlFor="search-input" className="sr-only">
        Search participants by name, email, or document
      </label>

      {/* Search Icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Search name, email, or document..."
        className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:opacity-60"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-hidden focus:text-slate-600"
          aria-label="Clear search"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
