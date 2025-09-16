import { useState, useEffect } from 'react';

interface DoneFilterProps {
  selectedDone: boolean | null;
  onDoneChange: (done: boolean | null) => void;
}

export function DoneFilter({ selectedDone, onDoneChange }: DoneFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const doneStates = [
    { value: null, label: 'All Notes', color: 'text-monokai-comment bg-surface-tertiary border-monokai-yellow' },
    { value: false, label: 'Active', color: 'text-monokai-blue bg-surface-tertiary border-monokai-yellow' },
    { value: true, label: 'Done', color: 'text-monokai-green bg-surface-tertiary border-monokai-yellow' }
  ];

  const selectedState = doneStates.find(state => state.value === selectedDone);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.done-filter-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative done-filter-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 bg-surface-secondary border-2 border-monokai-blue rounded-lg hover:bg-surface-tertiary hover:border-monokai-blue transition-colors text-monokai-fg"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4 mr-2 text-monokai-comment" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-monokai-fg">
          {selectedState ? selectedState.label : 'Filter by status'}
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform text-monokai-comment ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-48 bg-surface-secondary border-2 border-monokai-blue rounded-lg shadow-lg z-50">
          <div className="p-2">
            {doneStates.map((state) => (
              <button
                key={state.value === null ? 'all' : state.value.toString()}
                onClick={() => {
                  onDoneChange(state.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1 text-sm rounded mb-1 flex items-center text-monokai-fg hover:bg-surface-tertiary transition-colors ${
                  selectedDone === state.value ? 'bg-monokai-yellow bg-opacity-20 border border-monokai-yellow' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded mr-2 border-2 ${state.color}`} />
                <span className="flex-1">{state.label}</span>
                {selectedDone === state.value && (
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