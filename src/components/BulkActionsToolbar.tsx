import React from 'react';
import type { Note } from '../types/note';

interface BulkActionsToolbarProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onClearAll: () => void;
    onDeleteSelected: () => void;
    onUpdatePriority?: (priority: number) => void;
    onUpdateState?: (stateId: number) => void;
    isLoading?: boolean;
}

export const BulkActionsToolbar = React.memo(function BulkActionsToolbar({
    selectedCount,
    totalCount,
    onSelectAll,
    onClearAll,
    onDeleteSelected,
    onUpdatePriority,
    onUpdateState,
    isLoading = false
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="bg-surface-secondary border border-monokai border-opacity-30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-monokai-fg font-medium">
                        {selectedCount} of {totalCount} notes selected
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onSelectAll}
                            className="px-3 py-1 text-sm text-monokai-blue bg-surface-tertiary border border-monokai-blue rounded-md hover:bg-monokai-blue hover:bg-opacity-20 transition-colors"
                            disabled={isLoading}
                        >
                            Select All
                        </button>

                        <button
                            onClick={onClearAll}
                            className="px-3 py-1 text-sm text-monokai-pink bg-surface-tertiary border border-monokai-pink rounded-md hover:bg-monokai-pink hover:bg-opacity-20 transition-colors"
                            disabled={isLoading}
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
                                        priority === 4 ? 'border-monokai-green text-monokai-green hover:bg-monokai-green hover:bg-opacity-20' :
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

                    {/* Delete Button */}
                    <button
                        onClick={onDeleteSelected}
                        className="px-3 py-1 text-sm text-monokai-red bg-surface-tertiary border border-monokai-red rounded-md hover:bg-monokai-red hover:bg-opacity-20 transition-colors flex items-center gap-1"
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
                </div>
            </div>
        </div>
    );
});