import { useState } from 'react';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

type KanbanStatus = 'todo' | 'in-progress' | 'done';

interface KanbanBoardProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onLabelClick?: (label: string) => void;
}

export function KanbanBoard({ notes, onEdit, onDelete, onLabelClick }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);

  // Convert notes to kanban format
  const getNotesByStatus = (status: KanbanStatus) => {
    return notes.filter(note => {
      switch (status) {
        case 'todo':
          return !note.labels?.includes('done') && !note.labels?.includes('in-progress') && !note.labels?.includes('progress');
        case 'in-progress':
          return note.labels?.includes('in-progress') || note.labels?.includes('progress');
        case 'done':
          return note.labels?.includes('done');
        default:
          return true;
      }
    });
  };

  const columns: { status: KanbanStatus; title: string; colorClass: string }[] = [
    { status: 'todo', title: 'To Do', colorClass: 'bg-gray-50 border border-gray-200' },
    { status: 'in-progress', title: 'In Progress', colorClass: 'bg-blue-50 border border-blue-200' },
    { status: 'done', title: 'Done', colorClass: 'bg-green-50 border border-green-200' }
  ];

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {columns.map((column) => (
        <div
          key={column.status}
          className={`flex-1 min-w-80 max-w-96 ${column.colorClass} rounded-lg p-4 transition-all duration-200 ${
            dragOverColumn === column.status ? 'ring-2 ring-blue-400 ring-opacity-50 scale-105' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <span>{column.title}</span>
              <span className="bg-white bg-opacity-50 text-gray-600 px-2 py-1 rounded-full text-sm font-normal">
                {getNotesByStatus(column.status).length}
              </span>
            </h3>
          </div>

          <div className="space-y-3 min-h-32">
            {getNotesByStatus(column.status).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 bg-white bg-opacity-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📝</span>
                </div>
                <p className="text-sm">No {column.title.toLowerCase()} notes</p>
                <p className="text-xs text-gray-400 mt-1">
                  {column.status === 'todo' && 'Notes without "done" or "in-progress" labels'}
                  {column.status === 'in-progress' && 'Notes with "in-progress" or "progress" labels'}
                  {column.status === 'done' && 'Notes with "done" label'}
                </p>
              </div>
            ) : (
              getNotesByStatus(column.status).map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLabelClick={onLabelClick}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}