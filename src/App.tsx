import { useState, useEffect } from 'react';
import { NoteList } from './components/NoteList';
import { KanbanBoard } from './components/KanbanBoard';
import { NoteEditor } from './components/NoteEditor';
import { SearchBar } from './components/SearchBar';
import { Modal } from './components/Modal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { QuickCreateModal } from './components/QuickCreateModal';
import { useNotes } from './hooks/useNotes';
import { useDarkMode } from './hooks/useDarkMode';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from './types/note';
import './App.css';

function App() {
  const { notes, loading, error, createNote, updateNote, deleteNote, searchNotes, clearError } = useNotes();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteNoteData, setDeleteNoteData] = useState<Note | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showInlineCreate, setShowInlineCreate] = useState(false);

  // Filter and sort state
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'priority' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

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

  const handleDeleteNote = (note: Note) => {
    setDeleteNoteData(note);
  };

  const handleConfirmDelete = async () => {
    if (deleteNoteData) {
      await deleteNote(deleteNoteData.id!);
      setDeleteNoteData(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteNoteData(null);
  };

  const handleQuickCreate = () => {
    setShowQuickCreate(true);
  };

  const handleInlineCreate = () => {
    setShowInlineCreate(true);
  };

  const handleCancelInlineCreate = () => {
    setShowInlineCreate(false);
  };

  // Keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N for quick create
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleQuickCreate();
      }
      // Cmd/Ctrl + Shift + N for inline create (in list view)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'n' && viewMode === 'list') {
        e.preventDefault();
        handleInlineCreate();
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        if (showQuickCreate) setShowQuickCreate(false);
        if (showEditor) handleCancelEdit();
        if (deleteNoteData) handleCancelDelete();
        if (showInlineCreate) handleCancelInlineCreate();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickCreate, showEditor, deleteNoteData, showInlineCreate, viewMode]);

  return (
    <div className="min-h-screen bg-white dark:bg-primary-950">
      <header
        className="bg-gradient-to-r from-accent-600 to-accent-700 dark:from-accent-700 dark:to-accent-800 shadow-lg border-b border-primary-200 dark:border-primary-700"
        role="banner"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Juan Notes</h1>
                <p className="text-accent-100 dark:text-accent-200 text-sm">Organize your thoughts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="hidden sm:flex items-center p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <div className="hidden md:flex bg-white dark:bg-primary-800 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-accent-600 text-white'
                      : 'text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-700'
                  }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-accent-600 text-white'
                      : 'text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-700'
                  }`}
                >
                  📊 Kanban
                </button>
              </div>
              <button
                onClick={handleCreateNote}
                className="hidden md:flex items-center px-4 py-2 bg-white dark:bg-primary-800 text-accent-600 dark:text-accent-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-700 transition-colors font-medium shadow-sm"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Note
              </button>
            </div>
          </div>
        </div>
      </header>

      <main
        className="max-w-4xl mx-auto px-4 py-8"
        role="main"
        aria-label="Notes management"
      >
        {error && (
          <div className="mb-4 p-4 bg-danger-light border border-danger-200 dark:border-danger-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-danger-800 dark:text-danger-200">{error}</span>
              <button
                onClick={clearError}
                className="text-danger-600 dark:text-danger-400 hover:text-danger-800 dark:hover:text-danger-200"
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

        {viewMode === 'list' ? (
          <NoteList
            notes={notes}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
            loading={loading}
            selectedLabels={selectedLabels}
            onLabelsChange={setSelectedLabels}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            showInlineCreate={showInlineCreate}
            onInlineCreate={handleInlineCreate}
            onCancelInlineCreate={handleCancelInlineCreate}
            onSaveNote={handleSaveNote}
          />
        ) : (
          <KanbanBoard
            notes={notes}
            onEdit={handleEditNote}
            onDelete={handleDeleteNote}
            onLabelClick={(label) => {
              if (!selectedLabels.includes(label)) {
                setSelectedLabels([...selectedLabels, label]);
              }
            }}
          />
        )}

        <Modal
          isOpen={showEditor}
          onClose={handleCancelEdit}
          title={editingNote ? 'Edit Note' : 'Create New Note'}
          size="lg"
        >
          <NoteEditor
            note={editingNote}
            onSave={handleSaveNote}
            onCancel={handleCancelEdit}
            loading={loading}
          />
        </Modal>

        <DeleteConfirmModal
          isOpen={!!deleteNoteData}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          note={deleteNoteData}
          loading={loading}
        />

        <QuickCreateModal
          isOpen={showQuickCreate}
          onClose={() => setShowQuickCreate(false)}
          onSave={handleSaveNote}
          loading={loading}
          defaultLabels={selectedLabels}
          defaultPriority={selectedPriority || 0}
        />

        {/* Floating Action Button for Mobile */}
        <button
          onClick={handleCreateNote}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent-600 text-white rounded-full shadow-lg hover:bg-accent-700 transition-colors flex items-center justify-center z-40 focus:outline-none focus:ring-4 focus:ring-accent-light"
          disabled={loading}
          aria-label="Create new note"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </main>
    </div>
  );
}

export default App;
