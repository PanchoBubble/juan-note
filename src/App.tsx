import { useState } from 'react';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { SearchBar } from './components/SearchBar';
import { useNotes } from './hooks/useNotes';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from './types/note';
import './App.css';

function App() {
  const { notes, loading, error, createNote, updateNote, deleteNote, searchNotes, clearError } = useNotes();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowEditor(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleSaveNote = async (request: CreateNoteRequest | UpdateNoteRequest) => {
    try {
      if ('id' in request) {
        await updateNote(request);
      } else {
        await createNote(request);
      }
      setShowEditor(false);
      setEditingNote(null);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingNote(null);
  };

  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">📝 Juan Notes</h1>
            <button
              onClick={handleCreateNote}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              + New Note
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-800">{error}</span>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <SearchBar
          onSearch={searchNotes}
          loading={loading}
          placeholder="Search notes by title or content..."
        />

        {showEditor ? (
          <div className="mb-6">
            <NoteEditor
              note={editingNote}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              loading={loading}
            />
          </div>
        ) : (
          <NoteList
            notes={notes}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

export default App;
