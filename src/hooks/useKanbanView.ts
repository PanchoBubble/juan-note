import { useState, useEffect } from "react";
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

  const moveNote = (noteId: number, newStateId: number) => {
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
  };

  const handleDragStart = (note: KanbanNote) => {
    setDraggedNote(note);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleDrop = (stateId: number) => {
    if (draggedNote && draggedNote.stateId !== stateId) {
      moveNote(draggedNote.id!, stateId);
    }
    setDraggedNote(null);
  };

  const getNotesByState = (stateId: number) => {
    return kanbanNotes.filter(note => note.stateId === stateId);
  };

  const getNotesWithoutState = () => {
    return kanbanNotes.filter(note => !note.stateId);
  };

  // Create status labels and colors from states
  const STATUS_LABELS = states.reduce(
    (acc, state) => {
      acc[state.id!] = state.name;
      return acc;
    },
    {} as Record<number, string>
  );

  const STATUS_COLORS = states.reduce(
    (acc, state) => {
      acc[state.id!] = state.color
        ? `bg-[${state.color}]`
        : "bg-gray-100 border-gray-200";
      return acc;
    },
    {} as Record<number, string>
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
