import { useState, useEffect } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    loading: boolean;
    placeholder?: string;
    onQuickCreate?: (content: string) => void;
}

export function SearchBar({ onSearch, loading, placeholder = "Search notes...", onQuickCreate }: SearchBarProps) {


    const [query, setQuery] = useState('');

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            onSearch(query);
        }, 300); // Debounce search by 300ms

        return () => clearTimeout(debounceTimer);
    }, [query, onSearch]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Check for Enter key (both key name and keyCode for compatibility)
        const isEnter = e.key === 'Enter' || e.keyCode === 13;

        if (isEnter && e.shiftKey && onQuickCreate && query.trim()) {
            e.preventDefault();
            e.stopPropagation();
            onQuickCreate(query.trim());
            setQuery('');
        }

        // Handle Shift+Enter to focus search input (will be handled by parent)
        if (isEnter && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div className="relative mb-6">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="block w-full pl-4 pr-56 py-3 bg-surface-secondary text-monokai-fg border border-monokai border-opacity-30 rounded-lg focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-50 focus:border-monokai-blue placeholder-monokai-comment"
                    placeholder={placeholder}
                    disabled={loading}
                    autoComplete="off"
                />
                {!query && (
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
                {query && (
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
                        <span className="text-xs text-monokai-comment">Shift+Enter to create note</span>
                    </div>
                )}
                {loading && query && (
                    <div className="absolute right-20 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-monokai-blue"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
