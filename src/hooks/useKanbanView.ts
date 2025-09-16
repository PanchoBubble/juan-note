import { useState, useEffect, useCallback, useMemo } from "react";
import type { Note, State } from "../types/note";

export interface KanbanNote extends Note {
  stateId?: number;
  state?: State;
}

export function useKanbanView(notes: Note[], states: State[] = []) {
  const [kanbanNotes, setKanbanNotes] = useState<KanbanNote[]>([]);
  const [draggedNote, setDraggedNote] = useState<KanbanNote | null>(null);

  // Convert notes to kanban format with state information
  useEffect(() => {
    const converted = notes.map(note => {
      const state = states.find(s => s.id === note.state_id);
      return {
        ...note,
        stateId: note.state_id,
        state,
      };
    });
    setKanbanNotes(converted);
  }, [notes, states]);

  const moveNote = useCallback(
    (noteId: number, newStateId: number) => {
      setKanbanNotes(prev =>
        prev.map(note =>
          note.id === noteId
            ? {
                ...note,
                stateId: newStateId,
                state: states.find(s => s.id === newStateId),
              }
            : note
        )
      );
    },
    [states]
  );

  const handleDragStart = useCallback((note: KanbanNote) => {
    setDraggedNote(note);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedNote(null);
  }, []);

  const handleDrop = useCallback(
    (stateId: number) => {
      if (draggedNote && draggedNote.stateId !== stateId) {
        moveNote(draggedNote.id!, stateId);
      }
      setDraggedNote(null);
    },
    [draggedNote, moveNote]
  );

  const getNotesByState = useCallback(
    (stateId: number) => {
      return kanbanNotes.filter(note => note.stateId === stateId);
    },
    [kanbanNotes]
  );

  const getNotesWithoutState = useCallback(() => {
    return kanbanNotes.filter(note => !note.stateId);
  }, [kanbanNotes]);

  // Create status labels and colors from states
  const STATUS_LABELS = useMemo(
    () =>
      states.reduce(
        (acc, state) => {
          acc[state.id!] = state.name;
          return acc;
        },
        {} as Record<number, string>
      ),
    [states]
  );

  const STATUS_COLORS = useMemo(
    () =>
      states.reduce(
        (acc, state) => {
          acc[state.id!] = state.color
            ? `bg-[${state.color}]`
            : "bg-gray-100 border-gray-200";
          return acc;
        },
        {} as Record<number, string>
      ),
    [states]
  );

  return {
    kanbanNotes,
    draggedNote,
    moveNote,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    getNotesByState,
    getNotesWithoutState,
    STATUS_LABELS,
    STATUS_COLORS,
  };
}
