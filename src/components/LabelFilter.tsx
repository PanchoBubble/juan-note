import { useState, useEffect } from 'react';

interface LabelFilterProps {
  availableLabels: string[];
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
}

export function LabelFilter({ availableLabels, selectedLabels, onLabelsChange }: LabelFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getLabelColor = (label: string) => {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-green-50 text-green-700 border-green-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-pink-50 text-pink-700 border-pink-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-red-50 text-red-700 border-red-200',
      'bg-yellow-50 text-yellow-700 border-yellow-200',
      'bg-teal-50 text-teal-700 border-teal-200'
    ];
    const hash = label.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      onLabelsChange(selectedLabels.filter(l => l !== label));
    } else {
      onLabelsChange([...selectedLabels, label]);
    }
  };

  const clearAll = () => {
    onLabelsChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.label-filter-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative label-filter-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <span className="text-sm text-gray-700">
          {selectedLabels.length === 0
            ? 'Filter by labels'
            : `${selectedLabels.length} label${selectedLabels.length > 1 ? 's' : ''} selected`
          }
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            {availableLabels.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No labels available</p>
            ) : (
              <>
                {selectedLabels.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded mb-1"
                  >
                    Clear all filters
                  </button>
                )}
                {availableLabels.map((label) => (
                  <button
                    key={label}
                    onClick={() => toggleLabel(label)}
                    className={`w-full text-left px-2 py-1 text-sm rounded mb-1 flex items-center ${
                      selectedLabels.includes(label) ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded mr-2 border ${getLabelColor(label)}`} />
                    <span className="flex-1">{label}</span>
                    {selectedLabels.includes(label) && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}