import { NoteItem } from './NoteItem';
import { useKanbanView } from '../hooks/useKanbanView';
import type { KanbanNote, KanbanStatus } from '../hooks/useKanbanView';
import type { Note } from '../types/note';

interface KanbanColumnProps {
  status: KanbanStatus;
  title: string;
  notes: KanbanNote[];
  colorClass: string;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
  onDrop: (status: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

export function KanbanColumn({
  status,
  title,
  notes,
  colorClass,
  onEdit,
  onDelete,
  onLabelClick,
  onDrop,
  onDragOver,
  isDragOver
}: KanbanColumnProps) {
  const { handleDragStart } = useKanbanView([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(e);
  };

  return (
    <div
      className={`flex-1 min-w-80 max-w-96 ${colorClass} rounded-lg p-4 transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <span>{title}</span>
          <span className="bg-white bg-opacity-50 text-gray-600 px-2 py-1 rounded-full text-sm font-normal">
            {notes.length}
          </span>
        </h3>
      </div>

      <div className="space-y-3 min-h-32">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-12 h-12 bg-white bg-opacity-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-sm">No {title.toLowerCase()} notes</p>
            <p className="text-xs text-gray-400 mt-1">
              {status === 'todo' && 'Notes without "done" or "in-progress" labels'}
              {status === 'in-progress' && 'Notes with "in-progress" or "progress" labels'}
              {status === 'done' && 'Notes with "done" label'}
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              draggable
              onDragStart={() => handleDragStart(note)}
              className="cursor-move"
            >
              <NoteItem
                note={note}
                onEdit={onEdit}
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