interface AddColumnButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddColumnButton({
  onClick,
  disabled = false,
}: AddColumnButtonProps) {
  return (
    <div className="flex-none w-80 sm:w-96">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-monokai-blue focus:ring-opacity-50 ${
          disabled
            ? "border-monokai border-opacity-20 text-monokai-comment cursor-not-allowed"
            : "border-monokai-blue border-opacity-40 text-monokai-blue hover:border-opacity-60 hover:bg-monokai-blue hover:bg-opacity-5"
        }`}
        aria-label="Add new column"
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${
              disabled
                ? "border-monokai-comment"
                : "border-monokai-blue group-hover:border-monokai-blue"
            }`}
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
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Add Column</p>
            <p className="text-xs opacity-70">Create a new workflow stage</p>
          </div>
        </div>
      </button>
    </div>
  );
}
