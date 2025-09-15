
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

interface NoteListProps {
  notes: Note[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  loading: boolean;
}

export function NoteList({ notes, onEdit, onDelete, loading }: NoteListProps) {
  if (loading && notes.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading notes...</span>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes yet</h3>
        <p className="text-gray-600">Create your first note to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}