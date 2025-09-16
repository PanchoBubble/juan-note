import { NoteItem } from './NoteItem';
import { useDroppable } from '@dnd-kit/core';
import type { KanbanNote } from '../hooks/useKanbanView';
import type { Note } from '../types/note';

interface KanbanColumnProps {
  id: number;
  title: string;
  notes: KanbanNote[];
  colorClass: string;
  onEdit: (note: Note) => void;
  onComplete: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  isDragOver: boolean;
}

export function KanbanColumn({
  id,
  title,
  notes,
  colorClass,
  onEdit,
  onComplete,
  onDelete,
  onLabelClick,
  isDragOver
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id.toString(),
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-80 max-w-96 ${colorClass} rounded-lg p-4 transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-monokai-blue ring-opacity-50 scale-105' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-monokai-fg flex items-center space-x-2">
          <span>{title}</span>
          <span className="bg-surface-secondary bg-opacity-80 text-monokai-comment px-2 py-1 rounded-full text-sm font-normal border border-monokai-comment border-opacity-30">
            {notes.length}
          </span>
        </h3>
      </div>

      <div className="space-y-3 min-h-32">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-monokai-comment">
            <div className="w-12 h-12 bg-surface-secondary bg-opacity-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-monokai-comment border-opacity-30">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-sm">No {title.toLowerCase()} notes</p>
            <p className="text-xs text-monokai-comment mt-1">
              Drop notes here to assign them to {title.toLowerCase()}
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="cursor-move"
            >
              <NoteItem
                note={note}
                onEdit={onEdit}
                onComplete={onComplete}
                onDelete={onDelete}
                onLabelClick={onLabelClick}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}