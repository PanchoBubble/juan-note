import React, { useState } from "react";

interface SelectionMenuProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onDeleteSelected?: () => void;
  onUpdatePriority?: (priority: number) => void;
  onMarkAsDone?: () => void;
  onMarkAsUndone?: () => void;
  isLoading?: boolean;
}

export const SelectionMenu = React.memo(function SelectionMenu({
  selectedCount,
  totalCount,
  onClearSelection,
  onDeleteSelected,
  onUpdatePriority,
  onMarkAsDone,
  onMarkAsUndone,
  isLoading = false,
}: SelectionMenuProps) {
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <header
      className="bg-surface shadow-lg border-b border-monokai-comment h-32 flex items-center"
      role="banner"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-surface-secondary bg-opacity-80 rounded-lg flex items-center justify-center border border-monokai-comment border-opacity-30">
              <span className="text-monokai-fg text-xl">✓</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-monokai-fg">
                {selectedCount} of {totalCount} selected
              </h1>
              <p className="text-monokai-fg opacity-80 text-sm">
                Choose an action
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Priority Dropdown */}
            {onUpdatePriority && (
              <div className="relative">
                <button
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  className="px-3 py-1 text-sm text-monokai-yellow bg-surface-secondary border border-monokai-yellow rounded-md hover:bg-monokai-yellow hover:bg-opacity-20 transition-colors flex items-center gap-1"
                  disabled={isLoading}
                >
                  ⭐ Priority
                  <svg
                    className={`w-3 h-3 transition-transform ${showPriorityDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showPriorityDropdown && (
                  <div className="absolute top-full mt-1 bg-surface-secondary border border-monokai-comment rounded-md shadow-lg z-50 min-w-24">
                    {[1, 2, 3, 4, 5].map(priority => (
                      <button
                        key={priority}
                        onClick={() => {
                          onUpdatePriority(priority);
                          setShowPriorityDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-surface-tertiary transition-colors ${
                          priority === 1
                            ? "text-monokai-red"
                            : priority === 2
                              ? "text-monokai-orange"
                              : priority === 3
                                ? "text-monokai-yellow"
                                : priority === 4
                                  ? "text-monokai-green"
                                  : "text-monokai-blue"
                        }`}
                        disabled={isLoading}
                      >
                        {priority}{" "}
                        {priority === 1
                          ? "🔴"
                          : priority === 2
                            ? "🟠"
                            : priority === 3
                              ? "🟡"
                              : priority === 4
                                ? "🟢"
                                : "🔵"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mark as Done/Undone Toggle Button */}
            {(onMarkAsDone || onMarkAsUndone) && (
              <button
                onClick={onMarkAsDone || onMarkAsUndone}
                className={`px-3 py-1 text-sm bg-surface-secondary border rounded-md hover:bg-opacity-20 transition-colors ${
                  onMarkAsDone
                    ? "text-monokai-green border-monokai-green hover:bg-monokai-green"
                    : "text-monokai-orange border-monokai-orange hover:bg-monokai-orange"
                }`}
                disabled={isLoading}
              >
                {onMarkAsDone ? "✅ Mark Done" : "↩️ Mark Undone"}
              </button>
            )}

            {/* Delete Button */}
            {onDeleteSelected && (
              <button
                onClick={onDeleteSelected}
                className="px-3 py-1 text-sm text-monokai-red bg-surface-secondary border border-monokai-red rounded-md hover:bg-monokai-red hover:bg-opacity-20 transition-colors flex items-center gap-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-monokai-red border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  <>🗑️ Delete</>
                )}
              </button>
            )}

            {/* Clear Selection Button */}
            <button
              onClick={onClearSelection}
              className="px-2 py-1 text-sm text-monokai-comment bg-surface-secondary border border-monokai-comment rounded-md hover:bg-monokai-comment hover:bg-opacity-20 transition-colors"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});
