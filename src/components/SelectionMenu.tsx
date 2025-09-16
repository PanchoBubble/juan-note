import React from 'react';

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
    isLoading = false
}: SelectionMenuProps) {
    if (selectedCount === 0) return null;

    return (
        <header
            className="bg-gradient-to-r from-monokai-blue to-monokai-purple shadow-lg border-b border-monokai-comment"
            role="banner"
        >
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-surface-secondary bg-opacity-80 rounded-lg flex items-center justify-center border border-monokai-comment border-opacity-30">
                            <span className="text-monokai-fg text-xl">✓</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-monokai-fg">
                                {selectedCount} of {totalCount} selected
                            </h1>
                            <p className="text-monokai-fg opacity-80 text-sm">Choose an action</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Priority Update Buttons */}
                        {onUpdatePriority && (
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-monokai-comment mr-2">Priority:</span>
                                {[1, 2, 3, 4, 5].map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => onUpdatePriority(priority)}
                                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                                            priority === 1 ? 'border-monokai-red text-monokai-red hover:bg-monokai-red hover:bg-opacity-20' :
                                            priority === 2 ? 'border-monokai-orange text-monokai-orange hover:bg-monokai-orange hover:bg-opacity-20' :
                                            priority === 3 ? 'border-monokai-yellow text-monokai-yellow hover:bg-monokai-yellow hover:bg-opacity-20' :
                                            priority === 4 ? 'border-monokai-green text-monokai-green hover:bg-monokai-green hover:bg-monokai-green hover:bg-opacity-20' :
                                            'border-monokai-blue text-monokai-blue hover:bg-monokai-blue hover:bg-opacity-20'
                                        }`}
                                        disabled={isLoading}
                                        title={`Set priority to ${priority}`}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Mark as Done/Undone Buttons */}
                        {onMarkAsDone && (
                            <button
                                onClick={onMarkAsDone}
                                className="px-3 py-1 text-sm text-monokai-green bg-surface-secondary border border-monokai-green rounded-md hover:bg-monokai-green hover:bg-opacity-20 transition-colors flex items-center gap-1"
                                disabled={isLoading}
                            >
                                ✅ Mark as Done
                            </button>
                        )}
                        {onMarkAsUndone && (
                            <button
                                onClick={onMarkAsUndone}
                                className="px-3 py-1 text-sm text-monokai-orange bg-surface-secondary border border-monokai-orange rounded-md hover:bg-monokai-orange hover:bg-opacity-20 transition-colors flex items-center gap-1"
                                disabled={isLoading}
                            >
                                ↩️ Mark as Undone
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
                                    <>
                                        🗑️ Delete Selected
                                    </>
                                )}
                            </button>
                        )}

                        {/* Clear Selection Button */}
                        <button
                            onClick={onClearSelection}
                            className="px-3 py-1 text-sm text-monokai-comment bg-surface-secondary border border-monokai-comment rounded-md hover:bg-monokai-comment hover:bg-opacity-20 transition-colors"
                            disabled={isLoading}
                        >
                            ✕ Clear
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
});