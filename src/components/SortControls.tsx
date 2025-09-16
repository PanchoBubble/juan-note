import { useState, useEffect } from 'react';

interface SortControlsProps {
  sortBy: 'created' | 'updated' | 'priority' | 'title';
  onSortChange: (sort: 'created' | 'updated' | 'priority' | 'title') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export function SortControls({ sortBy, onSortChange, sortOrder, onSortOrderChange }: SortControlsProps) {
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);

  const sortOptions = [
    { value: 'updated', label: 'Last Updated', icon: '🕒' },
    { value: 'created', label: 'Date Created', icon: '📅' },
    { value: 'priority', label: 'Priority', icon: '⚡' },
    { value: 'title', label: 'Title', icon: '🔤' }
  ];

  const orderOptions = [
    { value: 'asc', label: 'Ascending', icon: '↑' },
    { value: 'desc', label: 'Descending', icon: '↓' }
  ];

  const selectedSortOption = sortOptions.find(option => option.value === sortBy);
  const selectedOrderOption = orderOptions.find(option => option.value === sortOrder);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownOpen && !(event.target as Element).closest('.sort-dropdown')) {
        setSortDropdownOpen(false);
      }
      if (orderDropdownOpen && !(event.target as Element).closest('.order-dropdown')) {
        setOrderDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdownOpen, orderDropdownOpen]);

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-monokai-comment font-medium">Sort:</span>

      {/* Sort By Dropdown */}
      <div className="relative sort-dropdown">
        <button
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className="flex items-center px-3 py-2 bg-surface-secondary border-2 border-monokai-blue border-opacity-50 rounded-lg hover:bg-surface-tertiary hover:border-monokai-blue transition-colors text-monokai-fg"
          aria-haspopup="listbox"
          aria-expanded={sortDropdownOpen}
        >
          <span className="mr-2">{selectedSortOption?.icon}</span>
          <span className="text-sm text-monokai-fg">{selectedSortOption?.label}</span>
          <svg className={`w-4 h-4 ml-2 transition-transform text-monokai-comment ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {sortDropdownOpen && (
          <div className="absolute top-full mt-1 w-48 bg-surface-secondary border-2 border-monokai-blue border-opacity-50 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value as any);
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-sm rounded mb-1 flex items-center text-monokai-fg hover:bg-surface-tertiary transition-colors ${
                    sortBy === option.value ? 'bg-monokai-blue bg-opacity-20 border border-monokai-blue' : ''
                  }`}
                >
                  <span className="mr-2">{option.icon}</span>
                  <span className="flex-1">{option.label}</span>
                  {sortBy === option.value && (
                    <svg className="w-4 h-4 text-monokai-blue" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sort Order Dropdown */}
      <div className="relative order-dropdown">
        <button
          onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
          className="flex items-center px-3 py-2 bg-surface-secondary border-2 border-monokai-blue border-opacity-50 rounded-lg hover:bg-surface-tertiary hover:border-monokai-blue transition-colors text-monokai-fg"
          aria-haspopup="listbox"
          aria-expanded={orderDropdownOpen}
        >
          <span className="mr-2">{selectedOrderOption?.icon}</span>
          <span className="text-sm text-monokai-fg">{selectedOrderOption?.label}</span>
          <svg className={`w-4 h-4 ml-2 transition-transform text-monokai-comment ${orderDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {orderDropdownOpen && (
          <div className="absolute top-full mt-1 w-32 bg-surface-secondary border-2 border-monokai-blue border-opacity-50 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {orderOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortOrderChange(option.value as any);
                    setOrderDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-sm rounded mb-1 flex items-center text-monokai-fg hover:bg-surface-tertiary transition-colors ${
                    sortOrder === option.value ? 'bg-monokai-blue bg-opacity-20 border border-monokai-blue' : ''
                  }`}
                >
                  <span className="mr-2">{option.icon}</span>
                  <span className="flex-1">{option.label}</span>
                  {sortOrder === option.value && (
                    <svg className="w-4 h-4 text-monokai-blue" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}