import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
  onQuickCreate?: (content: string) => void;
  onAddColumn?: () => void;
  showAddColumn?: boolean;
}

export function SearchBar({
  onSearch,
  loading,
  placeholder = "Search notes...",
  onQuickCreate,
  onAddColumn,
  showAddColumn = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(query);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(debounceTimer);
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check for Enter key (both key name and keyCode for compatibility)
    const isEnter = e.key === "Enter" || e.keyCode === 13;

    if (isEnter && e.shiftKey && onQuickCreate && query.trim()) {
      e.preventDefault();
      e.stopPropagation();
      onQuickCreate(query.trim());
      setQuery("");
    }

    // Handle Shift+Enter to focus search input (will be handled by parent)
    if (isEnter && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="relative mb-6">
      <div className="relative flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`select-text block w-full pl-4 py-3 bg-surface-secondary text-monokai-fg border-2 border-monokai-fg rounded-lg focus:ring-2 focus:ring-monokai-pink focus:ring-opacity-50 focus:border-purple-600 placeholder-monokai-comment ${
              showAddColumn ? "pr-12" : "pr-56"
            }`}
            placeholder={placeholder}
            disabled={loading}
            autoComplete="off"
          />
          {!query && !showAddColumn && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
          )}
          {query && !showAddColumn && (
            <div className="absolute inset-y-0 right-5 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-monokai-blue mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="text-xs text-monokai-comment">
                Shift+Enter to create note
              </span>
            </div>
          )}
          {loading && query && !showAddColumn && (
            <div className="absolute right-20 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-monokai-blue"></div>
            </div>
          )}
        </div>

        {showAddColumn && onAddColumn && (
          <button
            type="button"
            onClick={onAddColumn}
            className="inline-flex items-center justify-center w-12 h-12 rounded-lg border-2 border-dashed border-monokai-blue border-opacity-40 text-monokai-blue hover:border-opacity-60 hover:bg-monokai-blue hover:bg-opacity-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-50"
            aria-label="Add new column"
            title="Add new column"
          >
            <svg
              className="w-6 h-6 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
