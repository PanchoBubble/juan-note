
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
      <div className="flex flex-col justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-gray-600 font-medium">Loading your notes...</span>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">📝</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No notes yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">Start organizing your thoughts by creating your first note. Click the "New Note" button to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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