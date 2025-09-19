import { useState, useEffect, useCallback } from "react";
import { NoteService } from "../services/noteService";
import type { Note, CreateNoteRequest, UpdateNoteRequest } from "../types/note";

export interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  createNote: (request: CreateNoteRequest) => Promise<void>;
  updateNote: (request: UpdateNoteRequest) => Promise<void>;
  completeNote: (id: number) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
  reorderNotes: (notes: Note[]) => Promise<void>;
  clearError: () => void;
}

export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await NoteService.getAllNotes();
      if (response.success) {
        setNotes(response.data);
      } else {
        setError(response.error || "Failed to load notes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = useCallback(async (request: CreateNoteRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await NoteService.createNote(request);
      if (response.success && response.data) {
        setNotes(prev => [response.data!, ...prev]);
      } else {
        setError(response.error || "Failed to create note");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNote = useCallback(async (request: UpdateNoteRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await NoteService.updateNote(request);
      if (response.success && response.data) {
        setNotes(prev =>
          prev.map(note => (note.id === request.id ? response.data! : note))
        );
      } else {
        setError(response.error || "Failed to update note");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setLoading(false);
    }
  }, []);

  const completeNote = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await NoteService.updateNoteDone({ id, done: true });
      if (response.success && response.data) {
        setNotes(prev =>
          prev.map(note => (note.id === id ? response.data! : note))
        );
      } else {
        setError(response.error || "Failed to complete note");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete note");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNote = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await NoteService.deleteNote({ id });
      if (response.success) {
        setNotes(prev => prev.filter(note => note.id !== id));
      } else {
        setError(response.error || "Failed to delete note");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchNotes = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        // Inline the refresh logic to avoid dependency on refreshNotes
        setLoading(true);
        setError(null);
        try {
          const response = await NoteService.getAllNotes();
          if (response.success) {
            setNotes(response.data);
          } else {
            setError(response.error || "Failed to load notes");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load notes");
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await NoteService.searchNotes({ query, limit: 50 });
        if (response.success) {
          setNotes(response.data);
        } else {
          setError(response.error || "Failed to search notes");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search notes");
      } finally {
        setLoading(false);
      }
    },
    [] // Remove refreshNotes dependency
  );

  const reorderNotes = useCallback(
    async (reorderedNotes: Note[]) => {
      // Prepare data for bulk update
      const noteIds = reorderedNotes.map(note => note.id!).filter(Boolean);
      const orders = reorderedNotes.map(note => note.order ?? 0);

      // Safety check: ensure we have valid data
      if (noteIds.length === 0 || noteIds.length !== orders.length) {
        setError("Invalid data for reordering notes");
        return;
      }

      console.log("Reordering notes:", { noteIds, orders }); // Debug log

      try {
        const response = await NoteService.bulkUpdateNotesOrder(
          noteIds,
          orders
        );
        if (response.success) {
          // Only update state after successful API call
          setNotes(reorderedNotes);
        } else {
          setError(response.error || "Failed to reorder notes");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder notes"
        );
      }
    },
    [] // Remove refreshNotes dependency
  );

  // Initialize database and load notes on mount
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        await NoteService.initializeDatabase();
        const response = await NoteService.getAllNotes();
        if (response.success) {
          setNotes(response.data);
        } else {
          setError(response.error || "Failed to load notes");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize database"
        );
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    completeNote,
    deleteNote,
    searchNotes,
    refreshNotes,
    reorderNotes,
    clearError,
  };
}
