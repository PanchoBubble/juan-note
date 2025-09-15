interface SortControlsProps {
  sortBy: 'created' | 'updated' | 'priority' | 'title';
  onSortChange: (sort: 'created' | 'updated' | 'priority' | 'title') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export function SortControls({ sortBy, onSortChange, sortOrder, onSortOrderChange }: SortControlsProps) {
  const sortOptions = [
    { value: 'updated', label: 'Last Updated', icon: '🕒' },
    { value: 'created', label: 'Date Created', icon: '📅' },
    { value: 'priority', label: 'Priority', icon: '⚡' },
    { value: 'title', label: 'Title', icon: '🔤' }
  ];

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-600 font-medium">Sort by:</span>
      <div className="flex space-x-1">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value as any)}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === option.value
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="mr-1.5">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
      >
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
    </div>
  );
}