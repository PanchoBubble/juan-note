import { useState, useEffect } from 'react';

interface PriorityFilterProps {
  selectedPriority: number | null;
  onPriorityChange: (priority: number | null) => void;
}

export function PriorityFilter({ selectedPriority, onPriorityChange }: PriorityFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const priorities = [
    { value: null, label: 'All Priorities', color: 'text-monokai-comment bg-surface-tertiary border-monokai-yellow' },
    { value: 1, label: 'Low', color: 'text-monokai-yellow bg-surface-tertiary border-monokai-yellow' },
    { value: 2, label: 'Medium', color: 'text-monokai-orange bg-surface-tertiary border-monokai-yellow' },
    { value: 3, label: 'High', color: 'text-monokai-pink bg-surface-tertiary border-monokai-yellow' }
  ];

  const selectedPriorityItem = priorities.find(priority => priority.value === selectedPriority);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.priority-filter-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative priority-filter-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 bg-surface-secondary border-2 border-monokai-blue rounded-lg hover:bg-surface-tertiary hover:border-monokai-blue transition-colors text-monokai-fg"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4 mr-2 text-monokai-comment" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-sm text-monokai-fg">
          {selectedPriorityItem ? selectedPriorityItem.label : 'Filter by priority'}
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform text-monokai-comment ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-48 bg-surface-secondary border-2 border-monokai-blue rounded-lg shadow-lg z-50">
          <div className="p-2">
            {priorities.map((priority) => (
              <button
                key={priority.value ?? 'all'}
                onClick={() => {
                  onPriorityChange(priority.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1 text-sm rounded mb-1 flex items-center text-monokai-fg hover:bg-surface-tertiary transition-colors ${
                  selectedPriority === priority.value ? 'bg-monokai-yellow bg-opacity-20 border border-monokai-yellow' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded mr-2 border-2 ${priority.color}`} />
                <span className="flex-1">{priority.label}</span>
                {selectedPriority === priority.value && (
                  <svg className="w-4 h-4 text-monokai-yellow" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}