
import { useMemo } from 'react';
import { NoteItem } from './NoteItem';
import { LabelFilter } from './LabelFilter';
import { PriorityFilter } from './PriorityFilter';
import type { Note } from '../types/note';

interface NoteListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  loading: boolean;
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  selectedPriority: number | null;
  onPriorityChange: (priority: number | null) => void;
  sortBy: 'created' | 'updated' | 'priority' | 'title';
  onSortChange: (sort: 'created' | 'updated' | 'priority' | 'title') => void;
}

export function NoteList({
  notes,
  onEdit,
  onDelete,
  loading,
  selectedLabels,
  onLabelsChange,
  selectedPriority,
  onPriorityChange,
  sortBy,
  onSortChange
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

    // Sort notes
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'updated':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case 'priority':
          return b.priority - a.priority;
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [notes, selectedLabels, selectedPriority, sortBy]);

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

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>

          {(selectedLabels.length > 0 || selectedPriority !== null) && (
            <button
              onClick={() => {
                onLabelsChange([]);
                onPriorityChange(null);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      {filteredAndSortedNotes.length === 0 ? (
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
}