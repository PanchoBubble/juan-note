interface PriorityFilterProps {
  selectedPriority: number | null;
  onPriorityChange: (priority: number | null) => void;
}

export function PriorityFilter({ selectedPriority, onPriorityChange }: PriorityFilterProps) {
  const priorities = [
    { value: null, label: 'All Priorities', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { value: 1, label: 'Low', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { value: 2, label: 'Medium', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    { value: 3, label: 'High', color: 'text-red-700 bg-red-50 border-red-200' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 font-medium">Priority:</span>
      <div className="flex space-x-1">
        {priorities.map((priority) => (
          <button
            key={priority.value ?? 'all'}
            onClick={() => onPriorityChange(priority.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              selectedPriority === priority.value
                ? priority.color
                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {priority.label}
          </button>
        ))}
      </div>
    </div>
  );
}