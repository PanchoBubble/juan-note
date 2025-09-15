interface DoneFilterProps {
  selectedDone: boolean | null;
  onDoneChange: (done: boolean | null) => void;
}

export function DoneFilter({ selectedDone, onDoneChange }: DoneFilterProps) {
  const doneStates = [
    { value: null, label: 'All Notes', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { value: false, label: 'Active', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { value: true, label: 'Done', color: 'text-green-700 bg-green-50 border-green-200' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 font-medium">Status:</span>
      <div className="flex space-x-1">
        {doneStates.map((state) => (
          <button
            key={state.value === null ? 'all' : state.value.toString()}
            onClick={() => onDoneChange(state.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              selectedDone === state.value
                ? state.color
                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>
    </div>
  );
}