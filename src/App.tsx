import { useState, useEffect, useCallback } from "react";
import { NoteList } from "./components/NoteList";
import { KanbanBoard } from "./components/KanbanBoard";
import { NoteEditor } from "./components/NoteEditor";
import { SearchBar } from "./components/SearchBar";
import { Modal } from "./components/Modal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { CompleteConfirmModal } from "./components/CompleteConfirmModal";
import { QuickCreateModal } from "./components/QuickCreateModal";
import { SelectionMenu } from "./components/SelectionMenu";
import { McpIntegrationModal } from "./components/McpIntegrationModal";
import { McpFunctionBrowserModal } from "./components/McpFunctionBrowserModal";
import { SettingsModal } from "./components/SettingsModal";
import { AppHeader } from "./components/AppHeader";
import { useNotes } from "./hooks/useNotes";
import { useStates } from "./hooks/useStates";

import type { Note, CreateNoteRequest, UpdateNoteRequest } from "./types/note";
import "./App.css";

function App() {
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    completeNote,
    deleteNote,
    searchNotes,
    reorderNotes,
    clearError,
  } = useNotes();
  const { states } = useStates();

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteNoteData, setDeleteNoteData] = useState<Note | null>(null);
  const [completeNoteData, setCompleteNoteData] = useState<Note | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showMcpIntegration, setShowMcpIntegration] = useState(false);
  const [showMcpFunctionBrowser, setShowMcpFunctionBrowser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Filter and sort state
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);

  const [sortBy, setSortBy] = useState<
    "created" | "updated" | "priority" | "title" | "custom"
  >("custom");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectionState, setSelectionState] = useState<{
    count: number;
    total: number;
    selectedIds?: Set<number>;
  }>({ count: 0, total: 0 });

  const handleCreateNote = useCallback(() => {
    setEditingNote(null);
    setShowEditor(true);
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  }, []);

  const handleSaveNote = useCallback(
    async (request: CreateNoteRequest | UpdateNoteRequest) => {
      try {
        if ("id" in request) {
          await updateNote(request);
        } else {
          await createNote(request);
        }
        setShowEditor(false);
        setEditingNote(null);
      } catch (err) {
        console.error("Failed to save note:", err);
      }
    },
    [updateNote, createNote]
  );

  const handleUpdateNote = useCallback(
    async (note: Note) => {
      try {
        await updateNote({
          id: note.id!,
          title: note.title,
          content: note.content,
          priority: note.priority,
          labels: note.labels,
          deadline: note.deadline,
          reminder_minutes: note.reminder_minutes,
          done: note.done,
          state_id: note.state_id,
          order: note.order,
        });
      } catch (err) {
        console.error("Failed to update note:", err);
      }
    },
    [updateNote]
  );

  const handleCancelEdit = useCallback(() => {
    setShowEditor(false);
    setEditingNote(null);
  }, []);

  const handleDeleteNote = useCallback((note: Note) => {
    setDeleteNoteData(note);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteNoteData) {
      await deleteNote(deleteNoteData.id!);
      setDeleteNoteData(null);
    }
  }, [deleteNoteData, deleteNote]);

  const handleCancelDelete = useCallback(() => {
    setDeleteNoteData(null);
  }, []);

  const handleCompleteNote = useCallback((note: Note) => {
    setCompleteNoteData(note);
  }, []);

  const handleConfirmComplete = useCallback(async () => {
    if (completeNoteData) {
      await completeNote(completeNoteData.id!);
      setCompleteNoteData(null);
    }
  }, [completeNoteData, completeNote]);

  const handleCancelComplete = useCallback(() => {
    setCompleteNoteData(null);
  }, []);

  const handleQuickCreate = useCallback(() => {
    setShowQuickCreate(true);
  }, []);

  // Keyboard shortcuts and accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N for quick create
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        handleQuickCreate();
      }

      // Cmd/Ctrl + A for select all (when not in input field)
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            (activeElement as HTMLElement).contentEditable === "true");

        if (!isInputFocused) {
          e.preventDefault();
          // Trigger select all - this will be handled by NoteList component
          const selectAllEvent = new CustomEvent("selectAllNotes");
          document.dispatchEvent(selectAllEvent);
        }
      }

      // Escape to close modals and clear selection
      if (e.key === "Escape") {
        if (showQuickCreate) setShowQuickCreate(false);
        if (showEditor) handleCancelEdit();
        if (deleteNoteData) handleCancelDelete();
        if (completeNoteData) handleCancelComplete();

        // Clear selection if no modals are open
        if (
          !showQuickCreate &&
          !showEditor &&
          !deleteNoteData &&
          !completeNoteData
        ) {
          const clearSelectionEvent = new CustomEvent("clearNoteSelection");
          document.dispatchEvent(clearSelectionEvent);
        }
      }

      // Handle Shift+Enter to focus search input
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Auto-focus search input when typing while no input is focused
      // Only trigger for printable characters (not modifier keys, function keys, etc.)
      const isPrintableKey =
        e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isSpecialNavigationKey = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(e.key);

      if (isPrintableKey || isSpecialNavigationKey) {
        // Check if any input/textarea is currently focused
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            (activeElement as HTMLElement).contentEditable === "true");

        // If no input is focused, focus the search bar
        if (!isInputFocused) {
          const searchInput = document.querySelector(
            'input[placeholder*="Search"]'
          ) as HTMLInputElement;
          if (searchInput) {
            e.preventDefault();
            searchInput.focus();
            // If it's a printable character, also insert it into the search input
            if (isPrintableKey) {
              searchInput.value += e.key;
              // Trigger the change event to update the search
              searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    showQuickCreate,
    showEditor,
    deleteNoteData,
    completeNoteData,
    viewMode,
    handleQuickCreate,
    handleCancelEdit,
    handleCancelDelete,
    handleCancelComplete,
  ]);

  // Focus search bar when window gets focus and no input is focused
  useEffect(() => {
    const handleWindowFocus = () => {
      // Check if any input/textarea is currently focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).contentEditable === "true");

      // If no input is focused, focus the search bar
      if (!isInputFocused) {
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, []);

  const handleClearSelection = useCallback(() => {
    const clearSelectionEvent = new CustomEvent("clearNoteSelection");
    document.dispatchEvent(clearSelectionEvent);
  }, []);

  // Bulk action handlers
  const handleBulkDelete = useCallback(
    async (noteIds: number[]) => {
      try {
        for (const id of noteIds) {
          await deleteNote(id);
        }
        handleClearSelection();
      } catch (error) {
        console.error("Failed to delete notes:", error);
      }
    },
    [deleteNote]
  );

  const handleBulkUpdatePriority = useCallback(
    async (noteIds: number[], priority: number) => {
      try {
        for (const id of noteIds) {
          await updateNote({ id, priority });
        }
        handleClearSelection();
      } catch (error) {
        console.error("Failed to update priorities:", error);
      }
    },
    [updateNote]
  );

  const handleBulkMarkAsDone = useCallback(
    async (noteIds: number[], done: boolean) => {
      try {
        for (const id of noteIds) {
          await updateNote({ id, done });
        }
        handleClearSelection();
      } catch (error) {
        console.error("Failed to update done status:", error);
      }
    },
    [updateNote]
  );

  const isSelectionMode = selectionState.count > 0;

  return (
    <div className="min-h-screen bg-monokai-bg select-none">
      {/* Fixed height header container to prevent content shift */}
      <div className="relative h-32">
        {isSelectionMode ? (
          <SelectionMenu
            selectedCount={selectionState.count}
            totalCount={selectionState.total}
            onClearSelection={handleClearSelection}
            onDeleteSelected={() => {
              if (
                selectionState.selectedIds &&
                selectionState.selectedIds.size > 0
              ) {
                handleBulkDelete(Array.from(selectionState.selectedIds));
              }
            }}
            onUpdatePriority={priority => {
              if (
                selectionState.selectedIds &&
                selectionState.selectedIds.size > 0
              ) {
                handleBulkUpdatePriority(
                  Array.from(selectionState.selectedIds),
                  priority
                );
              }
            }}
            onMarkAsDone={() => {
              if (
                selectionState.selectedIds &&
                selectionState.selectedIds.size > 0
              ) {
                handleBulkMarkAsDone(
                  Array.from(selectionState.selectedIds),
                  true
                );
              }
            }}
            onMarkAsUndone={() => {
              if (
                selectionState.selectedIds &&
                selectionState.selectedIds.size > 0
              ) {
                handleBulkMarkAsDone(
                  Array.from(selectionState.selectedIds),
                  false
                );
              }
            }}
            isLoading={loading}
          />
        ) : (
          <AppHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onCreateNote={handleCreateNote}
            onOpenSettings={() => setShowSettings(true)}
            loading={loading}
          />
        )}
      </div>

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
          onQuickCreate={content => {
            const request: CreateNoteRequest = {
              title: content,
              content: "",
              priority: 0,
              labels: [],
            };
            handleSaveNote(request);
          }}
        />

        {viewMode === "list" ? (
          <NoteList
            notes={notes}
            onEdit={handleEditNote}
            onComplete={handleCompleteNote}
            onDelete={handleDeleteNote}
            onUpdate={handleUpdateNote}
            loading={loading}
            selectedLabels={selectedLabels}
            onLabelsChange={setSelectedLabels}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            setSelectionState={setSelectionState}
            onReorderNotes={reorderNotes}
            onSaveNote={handleSaveNote}
          />
        ) : (
          <KanbanBoard
            notes={notes}
            states={states}
            onEdit={handleEditNote}
            onComplete={handleCompleteNote}
            onDelete={handleDeleteNote}
            onUpdate={handleUpdateNote}
            onLabelClick={label => {
              if (!selectedLabels.includes(label)) {
                setSelectedLabels([...selectedLabels, label]);
              }
            }}
          />
        )}

        <Modal
          isOpen={showEditor}
          onClose={handleCancelEdit}
          title={editingNote ? "Edit Note" : "Create New Note"}
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
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <McpIntegrationModal
          isOpen={showMcpIntegration}
          onClose={() => setShowMcpIntegration(false)}
          onOpenFunctionBrowser={() => setShowMcpFunctionBrowser(true)}
        />

        <McpFunctionBrowserModal
          isOpen={showMcpFunctionBrowser}
          onClose={() => setShowMcpFunctionBrowser(false)}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </main>
    </div>
  );
}

export default App;
