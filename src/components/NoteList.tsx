
import React, { useMemo } from 'react';
import { NoteItem } from './NoteItem';
import { LabelFilter } from './LabelFilter';
import { PriorityFilter } from './PriorityFilter';
import { DoneFilter } from './DoneFilter';
import { SortControls } from './SortControls';
import { InlineCreate } from './InlineCreate';
import type { Note, CreateNoteRequest } from '../types/note';

interface NoteListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  loading: boolean;
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  selectedPriority: number | null;
  onPriorityChange: (priority: number | null) => void;
  selectedDone: boolean | null;
  onDoneChange: (done: boolean | null) => void;
  sortBy: 'created' | 'updated' | 'priority' | 'title';
  onSortChange: (sort: 'created' | 'updated' | 'priority' | 'title') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  showInlineCreate?: boolean;
  onInlineCreate?: () => void;
  onCancelInlineCreate?: () => void;
  onSaveNote?: (request: CreateNoteRequest) => Promise<void>;
}

export const NoteList = React.memo(function NoteList({
  notes,
  onEdit,
  onDelete,
  loading,
  selectedLabels,
  onLabelsChange,
  selectedPriority,
  onPriorityChange,
  selectedDone,
  onDoneChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  showInlineCreate = false,
  onInlineCreate,
  onCancelInlineCreate,
  onSaveNote
}: NoteListProps) {
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

    // Apply done filter
    if (selectedDone !== null) {
      filtered = filtered.filter(note => note.done === selectedDone);
    }

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
  }, [notes, selectedLabels, selectedPriority, selectedDone, sortBy, sortOrder]);

  if (loading && notes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-gray-600 font-medium">Loading your notes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Sort Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <LabelFilter
            availableLabels={availableLabels}
            selectedLabels={selectedLabels}
            onLabelsChange={onLabelsChange}
          />

          <PriorityFilter
            selectedPriority={selectedPriority}
            onPriorityChange={onPriorityChange}
          />

          <DoneFilter
            selectedDone={selectedDone}
            onDoneChange={onDoneChange}
          />

          <SortControls
            sortBy={sortBy}
            onSortChange={onSortChange}
            sortOrder={sortOrder}
            onSortOrderChange={onSortOrderChange}
          />

          <button
            onClick={onInlineCreate}
            className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
            disabled={loading}
          >
            + Add Note
          </button>

          {(selectedLabels.length > 0 || selectedPriority !== null || selectedDone !== null) && (
            <button
              onClick={() => {
                onLabelsChange([]);
                onPriorityChange(null);
                onDoneChange(null);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      {filteredAndSortedNotes.length === 0 && !showInlineCreate ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No notes match your filters</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-4">
            Try adjusting your filters or create a new note that matches your criteria.
          </p>
          <button
            onClick={() => {
              onLabelsChange([]);
              onPriorityChange(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {showInlineCreate && onSaveNote && (
            <InlineCreate
              onSave={onSaveNote}
              onCancel={onCancelInlineCreate || (() => {})}
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
              onDelete={onDelete}
              onLabelClick={(label) => {
                if (!selectedLabels.includes(label)) {
                  onLabelsChange([...selectedLabels, label]);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});