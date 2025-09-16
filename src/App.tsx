import { useState, useEffect } from 'react';
import { NoteList } from './components/NoteList';
import { KanbanBoard } from './components/KanbanBoard';
import { NoteEditor } from './components/NoteEditor';
import { SearchBar } from './components/SearchBar';
import { Modal } from './components/Modal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CompleteConfirmModal } from './components/CompleteConfirmModal';
import { QuickCreateModal } from './components/QuickCreateModal';
import { useNotes } from './hooks/useNotes';
import { useStates } from './hooks/useStates';

import type { Note, CreateNoteRequest, UpdateNoteRequest } from './types/note';
import './App.css';

function App() {
  const { notes, loading, error, createNote, updateNote, completeNote, deleteNote, searchNotes, clearError } = useNotes();
  const { states } = useStates();

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteNoteData, setDeleteNoteData] = useState<Note | null>(null);
  const [completeNoteData, setCompleteNoteData] = useState<Note | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);


  // Filter and sort state
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [selectedDone, setSelectedDone] = useState<boolean | null>(null);
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

  const handleCompleteNote = (note: Note) => {
    setCompleteNoteData(note);
  };

  const handleConfirmComplete = async () => {
    if (completeNoteData) {
      await completeNote(completeNoteData.id!);
      setCompleteNoteData(null);
    }
  };

  const handleCancelComplete = () => {
    setCompleteNoteData(null);
  };

  const handleQuickCreate = () => {
    setShowQuickCreate(true);
  };





  // Keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N for quick create
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleQuickCreate();
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (showQuickCreate) setShowQuickCreate(false);
        if (showEditor) handleCancelEdit();
        if (deleteNoteData) handleCancelDelete();
        if (completeNoteData) handleCancelComplete();

      }

      // Handle Shift+Enter to focus search input
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Auto-focus search input when typing while no input is focused
      // Only trigger for printable characters (not modifier keys, function keys, etc.)
      const isPrintableKey = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isSpecialNavigationKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key);

      if (isPrintableKey || isSpecialNavigationKey) {
        // Check if any input/textarea is currently focused
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).contentEditable === 'true'
        );

        // If no input is focused, focus the search bar
        if (!isInputFocused) {
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            e.preventDefault();
            searchInput.focus();
            // If it's a printable character, also insert it into the search input
            if (isPrintableKey) {
              searchInput.value += e.key;
              // Trigger the change event to update the search
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickCreate, showEditor, deleteNoteData, completeNoteData, viewMode]);

  // Focus search bar when window gets focus and no input is focused
  useEffect(() => {
    const handleWindowFocus = () => {
      // Check if any input/textarea is currently focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).contentEditable === 'true'
      );

      // If no input is focused, focus the search bar
      if (!isInputFocused) {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  return (
    <div className="min-h-screen bg-monokai-bg">
      <header
        className="bg-gradient-to-r from-monokai-blue to-monokai-purple shadow-lg border-b border-monokai-comment"
        role="banner"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-surface-secondary bg-opacity-80 rounded-lg flex items-center justify-center border border-monokai-comment border-opacity-30">
                <span className="text-monokai-fg text-xl">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-monokai-fg">Juan Notes</h1>
                <p className="text-monokai-fg opacity-80 text-sm">Organize your thoughts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex bg-surface-secondary rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-monokai-green text-monokai-bg'
                      : 'text-monokai-fg hover:bg-surface-tertiary'
                  }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-monokai-green text-monokai-bg'
                      : 'text-monokai-fg hover:bg-surface-tertiary'
                  }`}
                >
                  📊 Kanban
                </button>
              </div>
              <button
                onClick={handleCreateNote}
                className="hidden md:flex items-center px-4 py-2 bg-surface-secondary text-monokai-blue rounded-lg hover:bg-surface-tertiary transition-colors font-medium shadow-sm"
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
          <div className="mb-4 p-4 bg-danger-light border border-monokai-pink border-opacity-30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-monokai-pink">{error}</span>
              <button
                onClick={clearError}
                className="text-monokai-pink hover:text-monokai-orange"
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
          onQuickCreate={(content) => {
            const request: CreateNoteRequest = {
              title: content,
              content: '',
              priority: 0,
              labels: [],
            };
            handleSaveNote(request);
          }}
        />

        {viewMode === 'list' ? (
          <NoteList
            notes={notes}
            onEdit={handleEditNote}
            onComplete={handleCompleteNote}
            onDelete={handleDeleteNote}
            loading={loading}
            selectedLabels={selectedLabels}
            onLabelsChange={setSelectedLabels}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            selectedDone={selectedDone}
            onDoneChange={setSelectedDone}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}

            onSaveNote={handleSaveNote}
          />
        ) : (
          <KanbanBoard
            notes={notes}
            states={states}
            onEdit={handleEditNote}
            onComplete={handleCompleteNote}
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

        <CompleteConfirmModal
          isOpen={!!completeNoteData}
          onClose={handleCancelComplete}
          onConfirm={handleConfirmComplete}
          note={completeNoteData}
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
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-monokai-green text-monokai-bg rounded-full shadow-lg hover:bg-monokai-blue transition-colors flex items-center justify-center z-40 focus:outline-none focus:ring-4 focus:ring-monokai-green focus:ring-opacity-30"
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
