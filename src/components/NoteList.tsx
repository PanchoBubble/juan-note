
import React, { useMemo } from 'react';
import { NoteItem } from './NoteItem/';
import { LabelFilter } from './LabelFilter';
import { PriorityFilter } from './PriorityFilter';
import { SortControls } from './SortControls';
import { InlineCreate } from './InlineCreate';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { useMultiselect } from '../hooks/useMultiselect';
import type { Note, CreateNoteRequest } from '../types/note';

interface NoteListProps {
    notes: Note[];
    onEdit: (note: Note) => void;
    onComplete: (note: Note) => void;
    onDelete: (note: Note) => void;
    onBulkDelete?: (noteIds: number[]) => Promise<void>;
    onBulkUpdatePriority?: (noteIds: number[], priority: number) => Promise<void>;
    loading: boolean;
    selectedLabels: string[];
    onLabelsChange: (labels: string[]) => void;
    selectedPriority: number | null;
    onPriorityChange: (priority: number | null) => void;
    sortBy: 'created' | 'updated' | 'priority' | 'title';
    onSortChange: (sort: 'created' | 'updated' | 'priority' | 'title') => void;
    sortOrder: 'asc' | 'desc';
    onSortOrderChange: (order: 'asc' | 'desc') => void;
    showInlineCreate?: boolean;
    onCancelInlineCreate?: () => void;
    onSaveNote?: (request: CreateNoteRequest) => Promise<void>;
}

export const NoteList = React.memo(function NoteList({
    notes,
    onEdit,
    onComplete,
    onDelete,
    onBulkDelete,
    onBulkUpdatePriority,
    loading,
    selectedLabels,
    onLabelsChange,
    selectedPriority,
    onPriorityChange,
    sortBy,
    onSortChange,
    sortOrder,
    onSortOrderChange,
    showInlineCreate = false,
    onCancelInlineCreate,
    onSaveNote
}: NoteListProps) {
    const {
        selectedIds,
        selectedCount,
        isSelected,
        toggleSelection,
        selectAll,
        clearAll,
    } = useMultiselect();
    // Get all available labels from notes
    const availableLabels = useMemo(() => {
        const labelSet = new Set<string>();
        notes.forEach(note => {
            note.labels?.forEach(label => labelSet.add(label));
        });
        return Array.from(labelSet).sort();
    }, [notes]);

    // Filter and sort notes
    const filteredAndSortedNotes = useMemo(() => {
        let filtered = notes;

        // Apply label filter
        if (selectedLabels.length > 0) {
            filtered = filtered.filter(note =>
                selectedLabels.every(label => note.labels?.includes(label))
            );
        }

        // Apply priority filter
        if (selectedPriority !== null) {
            filtered = filtered.filter(note => note.priority === selectedPriority);
        }

        // Exclude done notes by default
        filtered = filtered.filter(note => !note.done);

        // Sort notes
        const sorted = [...filtered].sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'created':
                    comparison = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                    break;
                case 'updated':
                    comparison = new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
                    break;
                case 'priority':
                    comparison = b.priority - a.priority;
                    break;
                case 'title':
                    comparison = (a.title || '').localeCompare(b.title || '');
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? -comparison : comparison;
        });

        return sorted;
    }, [notes, selectedLabels, selectedPriority, sortBy, sortOrder]);

    if (loading && notes.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monokai-blue mb-4"></div>
                <span className="text-monokai-comment font-medium">Loading your notes...</span>
            </div>
        );
    }

    // Bulk action handlers
    const handleBulkDelete = async () => {
        if (onBulkDelete && selectedIds.size > 0) {
            const noteIds = Array.from(selectedIds);
            await onBulkDelete(noteIds);
            clearAll();
        }
    };

    const handleBulkUpdatePriority = async (priority: number) => {
        if (onBulkUpdatePriority && selectedIds.size > 0) {
            const noteIds = Array.from(selectedIds);
            await onBulkUpdatePriority(noteIds, priority);
            clearAll();
        }
    };



    const handleSelectAll = () => {
        selectAll(filteredAndSortedNotes);
    };

    const handleClearAll = () => {
        clearAll();
    };

    return (
        <div className="space-y-6">
            {/* Bulk Actions Toolbar */}
            <BulkActionsToolbar
                selectedCount={selectedCount}
                totalCount={filteredAndSortedNotes.length}
                onSelectAll={handleSelectAll}
                onClearAll={handleClearAll}
                onDeleteSelected={handleBulkDelete}
                onUpdatePriority={onBulkUpdatePriority ? handleBulkUpdatePriority : undefined}

                isLoading={loading}
            />

            {/* Filter and Sort Controls */}
            <div >
                <div className="flex flex-wrap items-center gap-3">
                    <LabelFilter
                        availableLabels={availableLabels}
                        selectedLabels={selectedLabels}
                        onLabelsChange={onLabelsChange}
                    />

                    <PriorityFilter
                        selectedPriority={selectedPriority}
                        onPriorityChange={onPriorityChange}
                    />



                    <SortControls
                        sortBy={sortBy}
                        onSortChange={onSortChange}
                        sortOrder={sortOrder}
                        onSortOrderChange={onSortOrderChange}
                    />



                    {(selectedLabels.length > 0 || selectedPriority !== null) && (
                        <button
                            onClick={() => {
                                onLabelsChange([]);
                                onPriorityChange(null);
                            }}
                            className="px-2 py-1 text-sm text-monokai-pink bg-surface-secondary border-2 border-monokai-pink rounded-md hover:bg-monokai-pink hover:bg-opacity-20 transition-colors"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Notes List */}
            {filteredAndSortedNotes.length === 0 && !showInlineCreate ? (
                <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-monokai-blue to-monokai-purple bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-monokai-yellow">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <h3 className="text-2xl font-bold text-monokai-fg mb-3">No notes match your filters</h3>
                    <p className="text-monokai-comment max-w-sm mx-auto mb-4">
                        Try adjusting your filters or create a new note that matches your criteria.
                    </p>
                    <button
                        onClick={() => {
                            onLabelsChange([]);
                            onPriorityChange(null);
                        }}
                        className="px-4 py-2 bg-monokai-green text-monokai-green border-2 border-monokai-green rounded-lg hover:bg-opacity-80 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                  <div className="flex flex-col gap-6">
                      {showInlineCreate && onSaveNote && (
                          <InlineCreate
                              onSave={onSaveNote}
                              onCancel={onCancelInlineCreate || (() => { })}
                              loading={loading}
                              defaultLabels={selectedLabels}
                              defaultPriority={selectedPriority || 0}
                          />
                      )}
                       {filteredAndSortedNotes.map((note) => (
                           <NoteItem
                               key={note.id}
                               note={note}
                               onEdit={onEdit}
                               onComplete={onComplete}
                               onDelete={onDelete}
                                           onLabelClick={(label) => {
                                               if (!selectedLabels.includes(label)) {
                                                   onLabelsChange([...selectedLabels, label]);
                                               }
                                           }}
                                           isSelected={note.id ? isSelected(note.id) : false}
                                           onSelectionChange={() => {
                                               if (note.id) {
                                                   toggleSelection(note.id);
                                               }
                                           }}
                                           showSelection={true}
                           />
                       ))}
                  </div>
            )}

            {/* Done/Archived Notes Section */}
            {(() => {
                const doneNotes = notes.filter(note => note.done);
                if (doneNotes.length === 0) return null;

                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-monokai-fg">Archived Notes</h3>
                            <span className="text-sm text-monokai-comment bg-surface-tertiary px-2 py-1 rounded">
                                {doneNotes.length} note{doneNotes.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                          <div className="flex flex-col gap-4">
                               {doneNotes
                                   .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
                                   .map((note) => (
                                       <NoteItem
                                           key={note.id}
                                           note={note}
                                           onEdit={onEdit}
                                           onComplete={onComplete}
                                           onDelete={onDelete}
                                           onLabelClick={(label) => {
                                               if (!selectedLabels.includes(label)) {
                                                   onLabelsChange([...selectedLabels, label]);
                                               }
                                           }}
                                           isSelected={note.id ? isSelected(note.id) : false}
                                           onSelectionChange={() => {
                                               if (note.id) {
                                                   toggleSelection(note.id);
                                               }
                                           }}
                                           showSelection={true}
                                       />
                                   ))}
                          </div>
                    </div>
                );
            })()}
        </div>
    );
});
