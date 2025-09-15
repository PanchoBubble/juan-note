import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
}

export function SearchBar({ onSearch, loading, placeholder = "Search notes..." }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(debounceTimer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="relative mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-monokai-comment"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full pl-10 pr-10 py-3 bg-surface-secondary text-monokai-fg border border-monokai-comment border-opacity-30 rounded-lg focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-50 focus:border-monokai-blue placeholder-monokai-comment"
          placeholder={placeholder}
          disabled={loading}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={loading}
          >
            <svg
              className="h-5 w-5 text-monokai-comment hover:text-monokai-pink"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
      {loading && query && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-monokai-blue"></div>
        </div>
      )}
    </div>
  );
}